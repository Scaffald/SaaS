/**
 * Helpers for the post-OAuth callback page (apps/scaffald/app/(auth)/auth/callback.tsx).
 * Extracted so they can be unit-tested without rendering the page itself.
 */

export type OAuthCallbackErrorParams = {
  error: string | null
  errorCode: string | null
  errorDescription: string | null
}

/**
 * Pull OAuth-error fragments from the callback URL. Supabase emits some
 * errors as `?error=...` (query string) and some implicit-flow style as
 * `#error=...` (URL hash) — we accept both.
 *
 * @param search  Value of `window.location.search` (e.g. "?error=server_error&error_description=...").
 * @param hash    Value of `window.location.hash` (e.g. "#error=...").
 * @returns null when no error fragments are present.
 */
export function readOAuthErrorParams(
  search: string,
  hash: string
): OAuthCallbackErrorParams | null {
  const fromSearch = new URLSearchParams(search.replace(/^\?/, ''))
  const fromHash = new URLSearchParams(hash.replace(/^#/, ''))

  const error = fromSearch.get('error') ?? fromHash.get('error')
  const errorCode = fromSearch.get('error_code') ?? fromHash.get('error_code')
  const errorDescription =
    fromSearch.get('error_description') ?? fromHash.get('error_description')

  if (!error && !errorCode && !errorDescription) return null

  return { error, errorCode, errorDescription }
}
