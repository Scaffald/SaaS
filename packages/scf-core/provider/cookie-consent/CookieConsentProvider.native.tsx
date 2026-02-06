import {
  CookieConsentBanner,
  type CookieConsentStorage,
  CookiePreferencesDialog,
  CookieConsentProvider as BeyondCookieConsentProvider,
} from '@unicornlove/beyond-ui'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { ReactNode } from 'react'

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

export const CookieConsentProvider = ({ children }: { children: ReactNode }) => {
  return (
    <BeyondCookieConsentProvider
      storage={storageAdapter}
      storageKey={STORAGE_KEY}
      policyVersion={POLICY_VERSION}
    >
      {children}
      <CookieConsentBanner />
      <CookiePreferencesDialog />
    </BeyondCookieConsentProvider>
  )
}
