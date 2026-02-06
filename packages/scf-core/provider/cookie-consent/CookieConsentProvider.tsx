import {
  CookieConsentBanner,
  CookiePreferencesDialog,
  CookieConsentProvider as UICookieConsentProvider,
} from '@unicornlove/ui'
import type { ReactNode } from 'react'

import { useThemeSetting } from '../theme/UniversalThemeProvider'

const STORAGE_KEY = 'scf-cookie-consent'
const POLICY_VERSION = '1'

export const CookieConsentProvider = ({ children }: { children: ReactNode }) => {
  const { resolvedTheme } = useThemeSetting()

  return (
    <UICookieConsentProvider storageKey={STORAGE_KEY} policyVersion={POLICY_VERSION}>
      {children}
      {typeof window !== 'undefined' && (
        <>
          <CookieConsentBanner theme={resolvedTheme} />
          <CookiePreferencesDialog />
        </>
      )}
    </UICookieConsentProvider>
  )
}
