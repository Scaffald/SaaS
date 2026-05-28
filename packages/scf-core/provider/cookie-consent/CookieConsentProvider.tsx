import {
  CookieConsentBanner,
  CookiePreferencesDialog,
  CookieConsentProvider as BeyondCookieConsentProvider,
  type CookieConsentState,
} from '@scaffald/ui'
import { Platform } from 'react-native'
import type { ReactNode } from 'react'
import { useCallback } from 'react'
import { supabase } from '@scf/core/utils/supabase/client'

const STORAGE_KEY = 'scf-cookie-consent'
const POLICY_VERSION = '1'

const CATEGORY_TO_CONSENT_TYPE: Record<string, string> = {
  'strictly-necessary': 'cookies_essential',
  performance: 'cookies_analytics',
}

async function recordConsentToDb(state: CookieConsentState) {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.user?.id) return

  const userAgent =
    Platform.OS === 'web' && typeof navigator !== 'undefined'
      ? navigator.userAgent
      : `ReactNative/${Platform.OS}`
  const deviceType = Platform.OS === 'web' ? 'desktop' : 'mobile'

  const records = Object.entries(state.selections)
    .map(([categoryId, given]) => {
      const consentType = CATEGORY_TO_CONSENT_TYPE[categoryId]
      if (!consentType) return null
      return {
        user_id: session.user.id,
        consent_type: consentType,
        consent_given: given,
        consent_version: state.version,
        consent_method: 'toggle_switch',
        consent_text: given
          ? `User enabled ${categoryId} cookies (policy v${state.version})`
          : `User disabled ${categoryId} cookies (policy v${state.version})`,
        user_agent: userAgent,
        device_type: deviceType,
        metadata: { category_id: categoryId, recorded_at: state.updatedAt },
      }
    })
    .filter((r): r is NonNullable<typeof r> => r != null)

  if (records.length === 0) return
  await supabase.from('consent_records').insert(records)
}

export const CookieConsentProvider = ({ children }: { children: ReactNode }) => {
  const handleConsentChange = useCallback((state: CookieConsentState) => {
    void recordConsentToDb(state)
  }, [])

  return (
    <BeyondCookieConsentProvider
      storageKey={STORAGE_KEY}
      policyVersion={POLICY_VERSION}
      onConsentChange={handleConsentChange}
    >
      {children}
      {typeof window !== 'undefined' && (
        <>
          <CookieConsentBanner privacyPolicyUrl="/auth/privacy" />
          <CookiePreferencesDialog />
        </>
      )}
    </BeyondCookieConsentProvider>
  )
}
