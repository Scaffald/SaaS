/**
 * Contact form handler for the marketing landing page.
 *
 * Replaces the Next.js route from the retired marketing site, which sent via
 * Resend. This sends via SendGrid instead: it is the transport the app's
 * notification emails already use (see
 * packages/supabase/functions/_shared/notifications/adapters/email.ts), so the
 * contact form inherits an account that is already warmed and SPF-authorized
 * rather than introducing a second sending domain to authenticate.
 *
 * Uses the HTTP API directly rather than the SDK so this stays dependency-free
 * and runs on any server runtime (Node, workerd, Bun).
 */

const SENDGRID_ENDPOINT = 'https://api.sendgrid.com/v3/mail/send'

const TO_EMAIL = process.env.CONTACT_FORM_TO ?? 'hello@scaffald.com'
// Must be a verified sender on the SendGrid account. Matches the notification
// adapter's default so both surfaces send as the same identity.
const FROM_EMAIL = process.env.CONTACT_FORM_FROM ?? 'notifications@scaffald.com'
const FROM_NAME = process.env.CONTACT_FORM_FROM_NAME ?? 'Scaffald'

type ContactBody = {
  name?: string
  email?: string
  company?: string
  orgType?: string
  orgTypeOther?: string
  message?: string
  /** Honeypot — hidden in the UI, so any value means a bot filled it. */
  website?: string
}

const RATE_LIMIT = { max: 5, windowMs: 60 * 60 * 1000 }

/**
 * Per-IP submission counter.
 *
 * In-process, so each instance keeps its own tally and it resets on deploy —
 * enough to blunt casual abuse of a public endpoint that sends email. Move to
 * a shared store if this ever runs behind more than a couple of instances.
 */
const hits = new Map<string, number[]>()

function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return request.headers.get('x-real-ip') ?? 'unknown'
}

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT.windowMs)
  if (recent.length >= RATE_LIMIT.max) {
    hits.set(ip, recent)
    return true
  }
  recent.push(now)
  hits.set(ip, recent)

  // Opportunistic sweep so the map can't grow without bound.
  if (hits.size > 5000) {
    for (const [key, times] of hits) {
      if (times.every((t) => now - t >= RATE_LIMIT.windowMs)) hits.delete(key)
    }
  }
  return false
}

const json = (body: unknown, status: number) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

/** Guards against oversized submissions being relayed into email. */
const trim = (value: unknown, max: number): string =>
  typeof value === 'string' ? value.trim().slice(0, max) : ''

export async function POST(request: Request): Promise<Response> {
  const body = (await request.json().catch(() => null)) as ContactBody | null
  if (!body) return json({ error: 'Invalid JSON body' }, 400)

  // Report success to bots so they don't retry or probe for the real check.
  if (trim(body.website, 100)) {
    console.warn('[contact] honeypot tripped, discarding submission')
    return json({ ok: true }, 200)
  }

  const ip = clientIp(request)
  if (isRateLimited(ip)) {
    return json({ error: 'Too many submissions. Please try again later.' }, 429)
  }

  const name = trim(body.name, 200)
  const email = trim(body.email, 320)
  const company = trim(body.company, 200)
  const orgType = trim(body.orgType, 100)
  const orgTypeOther = trim(body.orgTypeOther, 500)
  const message = trim(body.message, 5000)

  if (!name || !email || !company || !orgType) {
    return json({ error: 'Missing required fields' }, 400)
  }
  if (!isEmail(email)) {
    return json({ error: 'Invalid email address' }, 400)
  }

  const apiKey = process.env.SENDGRID_API_KEY
  if (!apiKey) {
    console.error('[contact] SENDGRID_API_KEY is not configured')
    return json({ error: 'Email not configured' }, 503)
  }

  const text = [
    `Name: ${name}`,
    `Email: ${email}`,
    `Organization: ${company}`,
    `Type: ${orgType}${orgType === 'Other' ? ` — ${orgTypeOther}` : ''}`,
    '',
    message ? `Message:\n${message}` : '(No message)',
  ].join('\n')

  try {
    const res = await fetch(SENDGRID_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: TO_EMAIL }] }],
        from: { email: FROM_EMAIL, name: FROM_NAME },
        // The submitter is never the sender — that would fail SPF and DMARC for
        // their domain. Replying to the notification reaches them instead.
        reply_to: { email, name: name || undefined },
        subject: `New contact form submission — ${company}`,
        content: [{ type: 'text/plain', value: text }],
      }),
    })

    // SendGrid answers a successful send with 202 and an empty body.
    if (!res.ok) {
      console.error('[contact] SendGrid rejected the request:', res.status, await res.text())
      return json({ error: 'Failed to send' }, 502)
    }

    return json({ ok: true }, 200)
  } catch (err) {
    console.error('[contact] Unexpected error sending mail:', err)
    return json({ error: 'Failed to send' }, 500)
  }
}
