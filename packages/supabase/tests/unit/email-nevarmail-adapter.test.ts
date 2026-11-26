/// <reference lib="deno.ns" />

/**
 * Notification email adapter on NevarMail (#1389). NevarMail is a third-party
 * API, so `fetch` is stubbed; everything else is the real adapter.
 */
import { assertEquals } from 'https://deno.land/std@0.208.0/assert/mod.ts'
import { emailAdapter } from '../../functions/_shared/notifications/adapters/email.ts'

type Call = { url: string; body: Record<string, unknown>; auth: string | null }

const ENV = {
  NEVARMAIL_API_KEY: 'nm-test-key',
  NEVARMAIL_USE_CASE_NOTIFICATIONS: 'uc-notifications',
  NEVARMAIL_BASE_URL: 'https://nevarmail.test',
}

async function withNevarMail(
  respond: (call: Call) => Response,
  run: (calls: Call[]) => Promise<void>,
  env: Record<string, string | undefined> = ENV
) {
  const saved = Object.fromEntries(Object.keys(ENV).map((k) => [k, Deno.env.get(k)]))
  for (const [k, v] of Object.entries({ ...Object.fromEntries(Object.keys(ENV).map((k) => [k, undefined])), ...env })) {
    if (v === undefined) Deno.env.delete(k)
    else Deno.env.set(k, v)
  }
  const realFetch = globalThis.fetch
  const calls: Call[] = []
  globalThis.fetch = (async (input: Request | URL | string, init?: RequestInit) => {
    const call = {
      url: String(input instanceof Request ? input.url : input),
      body: JSON.parse(String(init?.body ?? '{}')),
      auth: new Headers(init?.headers).get('authorization'),
    }
    calls.push(call)
    return respond(call)
  }) as typeof fetch
  try {
    await run(calls)
  } finally {
    globalThis.fetch = realFetch
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) Deno.env.delete(k)
      else Deno.env.set(k, v)
    }
  }
}

const notification = {
  id: 'n-1',
  type: 'job.application_received',
  title: 'New application',
  message: 'Jo applied to <Welder>',
  body: {},
} as never
const delivery = (metadata: Record<string, unknown>) => ({ id: 42, metadata }) as never
const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } })
const fail = (status: number, code: string) =>
  new Response(JSON.stringify({ error: { code, message: code } }), { status, headers: { 'content-type': 'application/json' } })

Deno.test('email adapter - sends through the notifications use case and keeps the id', async () => {
  await withNevarMail(() => ok({ id: 'msg-123', provider: 'sendgrid' }), async (calls) => {
    const result = await emailAdapter.send({ notification, delivery: delivery({ email: 'jo@example.com' }) } as never)
    assertEquals(result.status, 'sent')
    assertEquals(result.providerMessageId, 'msg-123')
    assertEquals(calls.length, 1)
    assertEquals(calls[0].url, 'https://nevarmail.test/api/v1/email/send')
    assertEquals(calls[0].auth, 'Bearer nm-test-key')
    const body = calls[0].body
    assertEquals(body.to, 'jo@example.com')
    assertEquals(body.use_case_id, 'uc-notifications')
    assertEquals(body.emailType, 'transactional')
    assertEquals(body.subject, 'New application')
    assertEquals(body.metadata, { notificationId: 'n-1', deliveryId: 42 })
    // No override: the use case's own sender (notifications@mail.scaffald.com).
    assertEquals('from' in body, false)
    // User-supplied text is escaped in the HTML fallback.
    assertEquals(String(body.html).includes('&lt;Welder&gt;'), true)
  })
})

Deno.test('email adapter - a sender override is a bare address plus a name', async () => {
  await withNevarMail(() => ok({ id: 'msg-1' }), async (calls) => {
    await emailAdapter.send({
      notification,
      delivery: delivery({ email: 'jo@example.com', fromEmail: 'team@mail.scaffald.com', fromName: 'Acme on Scaffald' }),
    } as never)
    assertEquals(calls[0].body.from, 'team@mail.scaffald.com')
    assertEquals(calls[0].body.fromName, 'Acme on Scaffald')
  })
})

Deno.test('email adapter - rate limits and outages retry, rejections fail', async () => {
  for (const [status, code, expected] of [
    [429, 'RATE_LIMITED', 'retry'],
    [503, 'UNAVAILABLE', 'retry'],
    [400, 'VALIDATION_ERROR', 'failed'],
  ] as const) {
    await withNevarMail(() => fail(status, code), async () => {
      const result = await emailAdapter.send({ notification, delivery: delivery({ email: 'jo@example.com' }) } as never)
      assertEquals(result.status, expected, `${status} ${code}`)
    })
  }
})

Deno.test('email adapter - fails without config or a recipient, and sends nothing', async () => {
  await withNevarMail(() => ok({ id: 'x' }), async (calls) => {
    const noUseCase = await emailAdapter.send({ notification, delivery: delivery({ email: 'jo@example.com' }) } as never)
    assertEquals(noUseCase.status, 'failed')
    assertEquals(calls.length, 0)
  }, { NEVARMAIL_API_KEY: 'nm-test-key' })

  await withNevarMail(() => ok({ id: 'x' }), async (calls) => {
    const noRecipient = await emailAdapter.send({ notification, delivery: delivery({}) } as never)
    assertEquals(noRecipient.status, 'failed')
    assertEquals(calls.length, 0)
  })
})
