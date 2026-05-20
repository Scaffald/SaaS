/**
 * Detect Apple's "Hide My Email" private relay addresses.
 *
 * When a user signs in with Apple and ticks "Hide My Email", Apple returns a
 * `<token>@privaterelay.appleid.com` address instead of their real one. The
 * relay is stable per (Apple user, Services ID), so it works as a login
 * identifier — but it breaks our email-based account auto-link, which means
 * the user can end up with a separate account from their real-email magic-link
 * sign-ups.
 *
 * This util powers the one-time banner that nudges relay-email users towards
 * the connected-accounts settings (see SC-62 Phase 3).
 */

const APPLE_PRIVATE_RELAY_DOMAIN = 'privaterelay.appleid.com'

export function isAppleRelayEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const normalized = email.trim().toLowerCase()
  return normalized.endsWith(`@${APPLE_PRIVATE_RELAY_DOMAIN}`)
}
