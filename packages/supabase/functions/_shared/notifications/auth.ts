/**
 * Service-only gate for the notification functions.
 *
 * These functions run with the service role client and take instructions from
 * their payload — notify-publish will send a notification with an arbitrary
 * title, message and CTA link to any user. They are internal infrastructure,
 * not API surface, so the only acceptable caller is one that already holds the
 * service role key: pg_cron (migration 025 sends it as the Bearer),
 * send-team-invitation, and the trpc routers' callEdgeFunction.
 *
 * verify_jwt is not a substitute — it accepts *any* valid project JWT,
 * including the public anon key, so with it alone anyone could drive these.
 */
export function requireServiceAuth(req: Request): Response | null {
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  // Fail closed: with no key configured nothing can authenticate, which is
  // preferable to an open endpoint that can email arbitrary content to users.
  if (!serviceKey) {
    console.error('[notifications/auth] SUPABASE_SERVICE_ROLE_KEY is not set; refusing request')
    return unauthorized()
  }

  const header = req.headers.get('authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : header

  if (!timingSafeEqual(token, serviceKey)) {
    return unauthorized()
  }

  return null
}

function unauthorized(): Response {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  })
}

/** Constant-time comparison so the key cannot be recovered byte by byte. */
function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder()
  const ab = enc.encode(a)
  const bb = enc.encode(b)
  // Length leaks are fine — the key length is not secret.
  if (ab.length !== bb.length) return false
  let diff = 0
  for (let i = 0; i < ab.length; i++) diff |= ab[i] ^ bb[i]
  return diff === 0
}
