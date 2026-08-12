import { supabase } from '@scf/core/utils/supabase/client'

let inFlight: Promise<void> | null = null
let lastAttemptAt = 0

/**
 * How long to wait before a second refresh attempt is allowed. Long enough that
 * a dead refresh token cannot turn a screen full of failing queries into a
 * request loop, short enough that a user who reconnects recovers quickly.
 */
const COOLDOWN_MS = 10_000

/**
 * Ask Supabase to refresh the session after an API call came back 401.
 *
 * Single-flight and rate-limited on purpose. A profile page fans out ~20 queries
 * on mount; without the lock every one that 401s kicks its own refresh, which is
 * how a single load of /profile/resume produced nine
 * `POST /auth/v1/token?grant_type=refresh_token` (#579).
 *
 * Deliberately swallows failures: the caller is an error handler, and a failed
 * refresh should surface as the original 401 rather than as a second error.
 * Sign-out on a genuinely dead session stays the responsibility of
 * AuthStateChangeHandler.
 */
export function requestSessionRefresh(): Promise<void> {
  if (inFlight) return inFlight

  const now = Date.now()
  if (now - lastAttemptAt < COOLDOWN_MS) return Promise.resolve()
  lastAttemptAt = now

  inFlight = supabase.auth
    .refreshSession()
    .then(() => undefined)
    .catch(() => undefined)
    .finally(() => {
      inFlight = null
    })

  return inFlight
}

/** Test seam — resets the single-flight lock and cooldown. */
export function resetSessionRefreshStateForTests(): void {
  inFlight = null
  lastAttemptAt = 0
}
