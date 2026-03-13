import {
  CookieConsentBanner,
  type CookieConsentStorage,
  type CookieConsentState,
  CookiePreferencesDialog,
  CookieConsentProvider as BeyondCookieConsentProvider,
} from '@scaffald/ui'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'
import type { ReactNode } from 'react'
import { useCallback } from 'react'
import { supabase } from '@scf/core/utils/supabase/client'

const STORAGE_KEY = 'scf-cookie-consent'
const POLICY_VERSION = '1'

const storageAdapter: CookieConsentStorage = {
  getItem: async (key) => {
    try {
      return await AsyncStorage.getItem(key)
    } catch (error) {
      console.warn('CookieConsent: unable to read AsyncStorage value', error)
      return null
    }
  },
  setItem: async (key, value) => {
    try {
      await AsyncStorage.setItem(key, value)
    } catch (error) {
      console.warn('CookieConsent: unable to write AsyncStorage value', error)
    }
  },
  removeItem: async (key) => {
    try {
      await AsyncStorage.removeItem(key)
    } catch (error) {
      console.warn('CookieConsent: unable to remove AsyncStorage value', error)
    }
  },
}

const CATEGORY_TO_CONSENT_TYPE: Record<string, string> = {
  'strictly-necessary': 'cookies_essential',
  performance: 'cookies_analytics',
}

async function recordConsentToDb(state: CookieConsentState) {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.user?.id) return

  const userAgent = `ReactNative/${Platform.OS}`
  const deviceType = Platform.OS === 'ios' || Platform.OS === 'android' ? 'mobile' : 'desktop'

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
      storage={storageAdapter}
      storageKey={STORAGE_KEY}
      policyVersion={POLICY_VERSION}
      onConsentChange={handleConsentChange}
    >
      {children}
      <CookieConsentBanner />
      <CookiePreferencesDialog />
    </BeyondCookieConsentProvider>
  )
}
