import {
  CookieConsentBanner,
  CookiePreferencesDialog,
  CookieConsentProvider as UICookieConsentProvider,
} from '@scaffald/neue-ui'
import type { ReactNode } from 'react'

const STORAGE_KEY = 'scf-cookie-consent'
const POLICY_VERSION = '1'

export const CookieConsentProvider = ({ children }: { children: ReactNode }) => {
  return (
    <UICookieConsentProvider storageKey={STORAGE_KEY} policyVersion={POLICY_VERSION}>
      {children}
      {typeof window !== 'undefined' && (
        <>
          <CookieConsentBanner />
          <CookiePreferencesDialog />
        </>
      )}
    </UICookieConsentProvider>
  )
}
