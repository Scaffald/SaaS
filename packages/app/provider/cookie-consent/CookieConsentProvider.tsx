import { type ReactNode } from 'react'
import {
  CookieConsentBanner,
  CookieConsentProvider as UICookieConsentProvider,
  CookiePreferencesDialog,
} from '@my/ui'

const STORAGE_KEY = 'scf-cookie-consent'
const POLICY_VERSION = '1'

export const CookieConsentProvider = ({ children }: { children: ReactNode }) => {
  if (typeof window === 'undefined') {
    // Skip consent UI during SSR so cookies only render client-side.
    return <>{children}</>
  }

  return (
    <UICookieConsentProvider storageKey={STORAGE_KEY} policyVersion={POLICY_VERSION}>
      {children}
      <CookieConsentBanner privacyPolicyUrl="/privacy-policy" />
      <CookiePreferencesDialog />
    </UICookieConsentProvider>
  )
}
