/**
 * Shared retry policy for every react-query client in the app.
 *
 * The SDK throws `ScaffaldError`s carrying the HTTP `statusCode`
 * (packages/sdk/src/http/errors.ts), so the policy can be status-aware without
 * the caller unwrapping anything.
 */

/**
 * Statuses where retrying the identical request with the identical client
 * cannot produce a different answer. Retrying them wastes the failure budget:
 * before #579 a 401 burned all three attempts inside ~3s, all of them against
 * the same stale token, so by the time Supabase refreshed there was no retry
 * left. 401 recovery is handled by invalidating on the token change instead —
 * see ScaffaldJobsSdkProviderFromSession.
 */
const NON_RETRYABLE_STATUSES = new Set([400, 401, 403, 404, 409, 422])

/** Pull an HTTP status off an unknown error, if it carries one. */
export function statusCodeOf(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null) return undefined
  const statusCode = (error as { statusCode?: unknown }).statusCode
  return typeof statusCode === 'number' ? statusCode : undefined
}

/** True when the error is an expired/absent-credential failure. */
export function isAuthError(error: unknown): boolean {
  return statusCodeOf(error) === 401
}

/**
 * `retry` predicate for queries and mutations.
 *
 * Network and 5xx failures keep the previous exponential-backoff behaviour;
 * deterministic 4xx failures give up immediately.
 */
export function shouldRetry(failureCount: number, error: unknown, maxRetries: number): boolean {
  const statusCode = statusCodeOf(error)
  if (statusCode !== undefined && NON_RETRYABLE_STATUSES.has(statusCode)) return false
  return failureCount < maxRetries
}
