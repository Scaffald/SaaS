/**
 * Theme persistence - localStorage on web, AsyncStorage on native
 */

import { Platform } from 'react-native'
import type { ThemeMode } from '../tokens/colors'

const STORAGE_KEY = 'scaffald-ui-theme'

function getWebStorage(): Storage | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage
  }
  return null
}

let asyncStorageModule: { default: { getItem: (k: string) => Promise<string | null>; setItem: (k: string, v: string) => Promise<void> } } | null = null

function getAsyncStorage() {
  if (asyncStorageModule) return asyncStorageModule.default
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- optional native dependency
    asyncStorageModule = require('@react-native-async-storage/async-storage') as {
      default: { getItem: (k: string) => Promise<string | null>; setItem: (k: string, v: string) => Promise<void> }
    }
    return asyncStorageModule.default
  } catch {
    return null
  }
}

export async function getStoredTheme(): Promise<ThemeMode | null> {
  if (Platform.OS === 'web') {
    const storage = getWebStorage()
    if (storage) {
      const stored = storage.getItem(STORAGE_KEY)
      if (stored === 'light' || stored === 'dark' || stored === 'system') return stored as ThemeMode
    }
    return null
  }

  const AsyncStorage = getAsyncStorage()
  if (!AsyncStorage) return null
  const stored = await AsyncStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark' || stored === 'system') return stored as ThemeMode
  return null
}

export async function setStoredTheme(theme: ThemeMode): Promise<void> {
  if (Platform.OS === 'web') {
    const storage = getWebStorage()
    if (storage) storage.setItem(STORAGE_KEY, theme)
    return
  }

  const AsyncStorage = getAsyncStorage()
  if (AsyncStorage) await AsyncStorage.setItem(STORAGE_KEY, theme)
}
