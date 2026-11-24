/**
 * What to do about invites when a user is signed in (#1395). Pure decision
 * logic; the storage and the request are passed in, so it tests without React.
 *
 * - A stored code (from /i/[code]) is claimed. Any answer from the server
 *   clears it, claimed or not (already attributed, not a new account, an
 *   invalid code): none of those change by trying again. A network error or
 *   5xx keeps it for the next session.
 * - With no stored code, the server is asked ONCE per user per device whether
 *   an email invite was sent to the user's address. That covers the invite
 *   email opened on another device.
 * - A successful claim remembers the inviter's first name for onboarding.
 */
import { type ClaimResult, InviteRequestError } from './invitesApi'

export interface ClaimDeps {
  readPending: () => Promise<{ code: string; landedAt: string } | null>
  clearPending: () => Promise<void>
  wasChecked: (userId: string) => Promise<boolean>
  markChecked: (userId: string) => Promise<void>
  storeInvitedBy: (firstName: string) => Promise<void>
  claim: (token: string, opts: { code?: string; landedAt?: string }) => Promise<ClaimResult>
}

export type ClaimOutcome =
  | { action: 'claimed'; firstName: string; via: 'code' | 'email' }
  | { action: 'not_claimed'; reason: string; via: 'code' | 'email' }
  | { action: 'skipped' }
  | { action: 'retry_later'; error: string }

export async function claimPendingInvite(
  user: { id: string; token: string },
  deps: ClaimDeps
): Promise<ClaimOutcome> {
  const pending = await deps.readPending()
  const via: 'code' | 'email' = pending ? 'code' : 'email'
  if (!pending && (await deps.wasChecked(user.id))) return { action: 'skipped' }

  let result: ClaimResult
  try {
    result = await deps.claim(user.token, pending ?? {})
  } catch (e) {
    if (e instanceof InviteRequestError && !e.retryable) {
      // A 4xx we don't understand won't fix itself either.
      if (pending) await deps.clearPending()
      await deps.markChecked(user.id)
      return { action: 'not_claimed', reason: e.message, via }
    }
    return { action: 'retry_later', error: (e as Error).message }
  }

  if (pending) await deps.clearPending()
  await deps.markChecked(user.id)
  if (result.claimed) {
    await deps.storeInvitedBy(result.referrer.firstName)
    return { action: 'claimed', firstName: result.referrer.firstName, via }
  }
  return { action: 'not_claimed', reason: result.reason, via }
}
