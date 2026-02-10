/**
 * Cookie consent storage reader used by useCookieConsentState.
 * Reads from the same key as the cookie consent UI provider (scf-cookie-consent)
 * so AuthProvider can use consent state without depending on @unicornlove/beyond-ui.
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
    if (!parsed || !parsed.selections || typeof parsed.selections !== 'object') return null
    return parsed
  } catch {
    return null
  }
}
