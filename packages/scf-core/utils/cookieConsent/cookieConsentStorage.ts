/**
 * Cookie consent storage reader used by useCookieConsentState.
 * Reads from the same key as the cookie consent UI provider (scf-cookie-consent)
 * so AuthProvider can use consent state without depending on @scaffald/ui.
 */

export const COOKIE_CONSENT_STORAGE_KEY = 'scf-cookie-consent'

export interface CookieConsentState {
  version: string
  updatedAt: string
  selections: Record<string, boolean>
}

export type CookieConsentStorageReader = {
  getItem: (key: string) => Promise<string | null>
}

/**
 * Get stored consent state. Uses AsyncStorage on native and localStorage on web.
 * Caller must pass a getItem function (e.g. from AsyncStorage or localStorage) for the current platform.
 */
export async function getConsentState(
  getItem: CookieConsentStorageReader['getItem']
): Promise<CookieConsentState | null> {
  try {
    const raw = await getItem(COOKIE_CONSENT_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CookieConsentState | null
    if (!parsed?.selections || typeof parsed.selections !== 'object') return null
    return parsed
  } catch {
    return null
  }
}

/**
 * What native answers instead of asking (#764).
 *
 * The iOS and Android apps collect no cookie consent: an app sets no cookies,
 * and the only analytics in the binary (PostHog, Sentry) are first-party
 * service providers — nothing tracks across apps, so Apple's mechanism for
 * this, App Tracking Transparency, does not apply either and the app declares
 * no `NSUserTrackingUsageDescription`. Showing the web "This site uses
 * cookies" sheet on a phone read as an unfinished web port and invited the
 * ATT question in review. So native reports this fixed state to everything
 * that gates on consent, and writes nothing to `consent_records`.
 *
 * `updatedAt` is the date native stopped asking, fixed on purpose: a value
 * that changes per launch would look like a fresh decision each time.
 */
export const NATIVE_IMPLICIT_CONSENT: CookieConsentState = {
  version: '1',
  updatedAt: '2026-09-17T00:00:00.000Z',
  selections: { 'strictly-necessary': true, performance: true },
}
