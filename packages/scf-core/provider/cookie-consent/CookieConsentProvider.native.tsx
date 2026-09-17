import {
  CookieConsentProvider as BeyondCookieConsentProvider,
  type CookieConsentStorage,
} from '@scaffald/ui'
import type { ReactNode } from 'react'
import {
  COOKIE_CONSENT_STORAGE_KEY,
  NATIVE_IMPLICIT_CONSENT,
} from '@scf/core/utils/cookieConsent/cookieConsentStorage'

/**
 * Native cookie consent: none (#764).
 *
 * This used to be a copy of the web provider — the "This site uses cookies"
 * sheet pinned to every screen of the iOS app, writing `consent_records` rows
 * tagged `ReactNative/ios`. An app sets no cookies, its analytics are
 * first-party (no cross-app tracking, so no App Tracking Transparency
 * prompt), and the sheet read to a reviewer as an unfinished web port.
 *
 * The provider stays so `useCookieConsent()` keeps working for anything
 * shared with web; it is fed NATIVE_IMPLICIT_CONSENT through a storage that
 * never persists, renders no banner and no dialog, and records nothing.
 * The privacy-label / Data Safety answers this implies are in
 * docs/agents/RELEASE-PROCESS.md.
 */
const implicitStorage: CookieConsentStorage = {
  getItem: async () => JSON.stringify(NATIVE_IMPLICIT_CONSENT),
  setItem: async () => {},
  removeItem: async () => {},
}

export const CookieConsentProvider = ({ children }: { children: ReactNode }) => (
  <BeyondCookieConsentProvider
    storage={implicitStorage}
    storageKey={COOKIE_CONSENT_STORAGE_KEY}
    policyVersion={NATIVE_IMPLICIT_CONSENT.version}
  >
    {children}
  </BeyondCookieConsentProvider>
)
