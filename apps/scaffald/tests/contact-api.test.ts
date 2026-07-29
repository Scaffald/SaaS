import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

/**
 * The contact endpoint is public, unauthenticated, and relays text into email —
 * so its abuse guards are the part worth testing. SendGrid is a third party, so
 * its HTTP call is stubbed; everything else is exercised for real.
 *
 * The module keeps rate-limit state in memory, so each test re-imports it fresh
 * and uses a distinct client IP.
 */

const VALID = {
  name: 'Dana Reyes',
  email: 'dana@example.com',
  company: 'Reyes Mechanical',
  orgType: 'Construction',
}

let ipCounter = 0

function request(body: Record<string, unknown>, ip?: string): Request {
  ipCounter += 1
  return new Request('http://localhost/api/contact', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': ip ?? `10.0.0.${ipCounter}`,
    },
    body: JSON.stringify(body),
  })
}

async function loadRoute() {
  vi.resetModules()
  return import('../app/api/contact+api')
}

beforeEach(() => {
  process.env.SENDGRID_API_KEY = 'test-key'
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify({ id: 'stub' }), { status: 200 }))
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
  // `process.env.X = undefined` stores the *string* "undefined", which is
  // truthy — the variable has to be deleted to simulate an unset key.
  delete process.env.SENDGRID_API_KEY
})

describe('validation', () => {
  test('accepts a complete submission and sends exactly one email', async () => {
    const { POST } = await loadRoute()
    const res = await POST(request(VALID))

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ ok: true })
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(vi.mocked(fetch).mock.calls[0][0]).toBe('https://api.sendgrid.com/v3/mail/send')
  })

  test.each(['name', 'email', 'company', 'orgType'])(
    'rejects a submission missing %s',
    async (field) => {
      const { POST } = await loadRoute()
      const body: Record<string, unknown> = { ...VALID }
      delete body[field]

      const res = await POST(request(body))

      expect(res.status).toBe(400)
      expect(fetch).not.toHaveBeenCalled()
    }
  )

  test.each(['not-an-email', 'missing@tld', '@example.com', 'spaces in@example.com'])(
    'rejects malformed email %s',
    async (email) => {
      const { POST } = await loadRoute()
      const res = await POST(request({ ...VALID, email }))

      expect(res.status).toBe(400)
      expect(fetch).not.toHaveBeenCalled()
    }
  )

  test('rejects a non-JSON body without throwing', async () => {
    const { POST } = await loadRoute()
    const res = await POST(
      new Request('http://localhost/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.9.9.9' },
        body: 'not json',
      })
    )

    expect(res.status).toBe(400)
  })

  test('reports a configuration problem rather than failing silently', async () => {
    delete process.env.SENDGRID_API_KEY
    const { POST } = await loadRoute()
    const res = await POST(request(VALID))

    expect(res.status).toBe(503)
    expect(fetch).not.toHaveBeenCalled()
  })
})

describe('honeypot', () => {
  test('discards a submission with the hidden field filled', async () => {
    const { POST } = await loadRoute()
    const res = await POST(request({ ...VALID, website: 'http://spam.example' }))

    // Reports success so bots do not probe for the real check.
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ ok: true })
    // But nothing is actually sent.
    expect(fetch).not.toHaveBeenCalled()
  })

  test('an empty honeypot is treated as a genuine submission', async () => {
    const { POST } = await loadRoute()
    const res = await POST(request({ ...VALID, website: '' }))

    expect(res.status).toBe(200)
    expect(fetch).toHaveBeenCalledTimes(1)
  })
})

describe('rate limiting', () => {
  test('allows 5 submissions per IP then returns 429', async () => {
    const { POST } = await loadRoute()
    const ip = '203.0.113.7'

    for (let i = 0; i < 5; i++) {
      const res = await POST(request(VALID, ip))
      expect(res.status).toBe(200)
    }

    const blocked = await POST(request(VALID, ip))
    expect(blocked.status).toBe(429)
    expect(fetch).toHaveBeenCalledTimes(5)
  })

  test('limits per IP rather than globally', async () => {
    const { POST } = await loadRoute()

    for (let i = 0; i < 5; i++) {
      await POST(request(VALID, '198.51.100.1'))
    }
    expect((await POST(request(VALID, '198.51.100.1'))).status).toBe(429)

    // A different visitor must not inherit someone else's exhausted budget.
    expect((await POST(request(VALID, '198.51.100.2'))).status).toBe(200)
  })

  test('uses the first hop of x-forwarded-for', async () => {
    const { POST } = await loadRoute()
    const chain = '198.51.100.50, 10.0.0.1, 172.16.0.1'

    for (let i = 0; i < 5; i++) {
      await POST(
        new Request('http://localhost/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-forwarded-for': chain },
          body: JSON.stringify(VALID),
        })
      )
    }

    // Same client, same chain -> same bucket, so the 6th is blocked.
    const blocked = await POST(
      new Request('http://localhost/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': chain },
        body: JSON.stringify(VALID),
      })
    )
    expect(blocked.status).toBe(429)
  })
})

describe('email payload', () => {
  const sentPayload = () => {
    const [, init] = vi.mocked(fetch).mock.calls[0]
    return JSON.parse(String((init as RequestInit).body))
  }

  const sentText = () => String(sentPayload().content[0].value)

  test('sets reply-to to the submitter and includes their message', async () => {
    const { POST } = await loadRoute()
    await POST(request({ ...VALID, message: 'We need three welders in March.' }))
    const payload = sentPayload()

    expect(payload.reply_to.email).toBe(VALID.email)
    expect(payload.subject).toContain(VALID.company)
    expect(sentText()).toContain('We need three welders in March.')
    expect(sentText()).toContain(VALID.name)
  })

  test('sends from our own verified sender, never the submitter', async () => {
    // Sending as the submitter's address fails SPF/DMARC for their domain and
    // gets the whole account flagged as a spoofer.
    const { POST } = await loadRoute()
    await POST(request(VALID))

    expect(sentPayload().from.email).not.toBe(VALID.email)
    expect(sentPayload().from.email).toMatch(/@scaffald\.com$/)
  })

  test('addresses exactly one recipient', async () => {
    const { POST } = await loadRoute()
    await POST(request(VALID))

    expect(sentPayload().personalizations).toHaveLength(1)
    expect(sentPayload().personalizations[0].to).toHaveLength(1)
  })

  test('truncates oversized input before relaying it', async () => {
    const { POST } = await loadRoute()
    await POST(request({ ...VALID, message: 'x'.repeat(10_000) }))

    expect(sentText().length).toBeLessThan(6_000)
  })

  test('surfaces an upstream failure instead of claiming success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('rejected', { status: 422 }))
    )
    const { POST } = await loadRoute()
    const res = await POST(request(VALID))

    expect(res.status).toBe(502)
  })
})
