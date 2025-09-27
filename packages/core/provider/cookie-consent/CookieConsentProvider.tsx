import { type ReactNode } from 'react'
import {
  CookieConsentBanner,
  CookieConsentProvider as UICookieConsentProvider,
  CookiePreferencesDialog,
} from '@app/ui'

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
