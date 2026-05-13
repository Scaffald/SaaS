/**
 * App Tracking Transparency status, normalized across platforms.
 *
 * - `unavailable` — platform doesn't require ATT (Android, web, iOS < 14.5).
 *   Treat as "free to track" for the purposes of this module; other consent
 *   layers (CookieConsentProvider for GDPR) still apply.
 * - `not-determined` — user hasn't been asked yet. Do NOT identify users
 *   until this is resolved.
 * - `granted` — user tapped "Allow". Full identification flow is permitted.
 * - `denied` — user tapped "Ask App Not to Track". Skip identify/alias and
 *   strip PII from Sentry. Anonymous capture remains allowed.
 * - `restricted` — parental controls or MDM block tracking. Treat as denied.
 */
export type TrackingAuthorizationStatus =
  | 'unavailable'
  | 'not-determined'
  | 'granted'
  | 'denied'
  | 'restricted'

/**
 * Whether the current status allows linking user identity to analytics events
 * (PostHog identify/alias, Sentry setUser with email). This is the boolean
 * AuthProvider should consult before calling those APIs on iOS.
 */
export function canLinkIdentity(status: TrackingAuthorizationStatus): boolean {
  return status === 'granted' || status === 'unavailable'
}
