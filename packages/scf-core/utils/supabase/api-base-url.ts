/**
 * Single source of truth for which backend this client talks to.
 *
 * There are two independent consumers — the Supabase auth/REST client
 * (./client.ts) and the Scaffald SDK (two providers) — and until #376 each
 * resolved its own base URL from its own copy of this logic. The copies were
 * byte-identical, which is exactly why the divergence was invisible: nothing
 * was wrong with the code, the two consumers just read different env vars and
 * nobody compared the answers.
 *
 * The failure that motivated this (audit 2026-06-23, finding F4): a previous
 * `pnpm web:remote` bakes EXPO_PUBLIC_SCAFFALD_API_URL pointing at the remote
 * dev project into Metro's cache. A later `pnpm web` does not clear that cache
 * — only `expo start -c` does — so auth talks to local 127.0.0.1:54321 while
 * every SDK call goes to the remote project. The symptom is not "wrong
 * backend"; it is 401s and a fully-onboarded user bounced to /onboarding,
 * because the prerequisites check asks a database that has never heard of
 * them. That reads as an onboarding bug and cost a long debugging detour.
 *
 * So this module does two things: resolves once, and says so out loud when the
 * two answers disagree.
 */

import Constants from 'expo-constants'

type SupabaseExtra = { url?: string; anonKey?: string }

function readExtra(): SupabaseExtra | undefined {
  return (Constants?.expoConfig?.extra as { supabase?: SupabaseExtra })?.supabase
}

/** The Supabase project the auth/REST client connects to. */
export function getSupabaseAuthUrl(): string {
  return (process.env.EXPO_PUBLIC_SUPABASE_URL ?? readExtra()?.url ?? '').replace(/\/$/, '')
}

/**
 * The base URL the Scaffald SDK issues requests against.
 *
 * Normally derived from the same Supabase URL as auth, so the two cannot
 * disagree. EXPO_PUBLIC_SCAFFALD_API_URL overrides that — it is the only way
 * they come apart, and the only reason the check below exists.
 */
export function getSupabaseApiBaseUrl(): string {
  // Explicit override (must include /functions/v1/api for local Supabase).
  const explicitApiUrl = process.env.EXPO_PUBLIC_SCAFFALD_API_URL
  if (explicitApiUrl?.trim()) return explicitApiUrl.replace(/\/$/, '')

  const base = getSupabaseAuthUrl()
  if (!base) return ''
  // Already includes the API path — do not double-append.
  if (base.endsWith('/functions/v1/api')) return base
  // Local Supabase serves the API at /functions/v1/api; a bare /v1/* request
  // hits Kong directly and fails CORS.
  return `${base}/functions/v1/api`
}

export function getSupabaseAnonKey(): string {
  return process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? readExtra()?.anonKey ?? ''
}

/** Origin only — the path differs by design (/functions/v1/api), the host must not. */
function originOf(url: string): string | null {
  if (!url) return null
  try {
    return new URL(url).origin
  } catch {
    return null
  }
}

let warned = false

/**
 * Warn — loudly, once — when auth and the SDK are pointed at different hosts.
 *
 * Development only. A split origin is legitimate in production (auth on
 * Supabase, SDK behind an API gateway), so failing or warning there would be
 * noise. In local dev it is always the stale-cache bug, and the fix is always
 * the same, so the message says what to run rather than only what is wrong.
 */
export function warnOnBackendMismatch(): void {
  if (!__DEV__ || warned) return

  const authOrigin = originOf(getSupabaseAuthUrl())
  const apiOrigin = originOf(getSupabaseApiBaseUrl())
  if (!authOrigin || !apiOrigin || authOrigin === apiOrigin) return

  warned = true
  // console.error rather than logger.error: this is a dev-only message for
  // whoever is running the server, and logger.error unconditionally reports to
  // Sentry and prefixes every call, which mangles a formatted block.
  console.error(
    [
      'Supabase backend mismatch — auth and the Scaffald SDK are talking to different projects.',
      `  auth (EXPO_PUBLIC_SUPABASE_URL):        ${authOrigin}`,
      `  SDK  (EXPO_PUBLIC_SCAFFALD_API_URL):    ${apiOrigin}`,
      '',
      'Expect SDK calls to 401/500 and an onboarded user to be bounced to /onboarding —',
      'the prerequisites check is querying a database that has no record of them.',
      '',
      "This is almost always Metro's cache holding EXPO_PUBLIC_SCAFFALD_API_URL from an",
      'earlier `pnpm web:remote`. Restart with a cleared cache:',
      '',
      '  pnpm --filter scaffald-app exec expo start --web -c',
      '',
      'See #376.',
    ].join('\n')
  )
}
