/**
 * Reads cookie consent state from storage (same key as the cookie consent UI provider).
 * Use this in AuthProvider so core does not depend on @unicornlove/ui for consent.
 * Requires CookieConsentProvider (or equivalent) to have written state to storage.
 */

import AsyncStorage from '@react-native-async-storage/async-storage'
import { useCallback, useEffect, useState } from 'react'
import { Platform } from 'react-native'

import { getConsentState } from './cookieConsentStorage'

export function useCookieConsentState(): {
  isReady: boolean
  hasConsentedTo: (categoryId: string) => boolean
} {
  const [state, setState] = useState<{ selections: Record<string, boolean> } | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      const getItem = Platform.OS === 'web' ? getWebStorageItem : getAsyncStorageItem
      const parsed = await getConsentState(getItem)
      if (cancelled) return
      setState(parsed ? { selections: parsed.selections } : null)
      setIsReady(true)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const hasConsentedTo = useCallback(
    (categoryId: string) => Boolean(state?.selections?.[categoryId]),
    [state]
  )

  return { isReady, hasConsentedTo }
}

async function getAsyncStorageItem(key: string): Promise<string | null> {
  return AsyncStorage.getItem(key)
}

function getWebStorageItem(key: string): Promise<string | null> {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return Promise.resolve(window.localStorage.getItem(key))
    }
  } catch {
    // ignore
  }
  return Promise.resolve(null)
}
