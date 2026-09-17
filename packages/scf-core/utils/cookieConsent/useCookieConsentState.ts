/**
 * Reads cookie consent state from storage (same key as the cookie consent UI provider).
 * Use this in AuthProvider so core does not depend on @scaffald/ui for consent.
 * Requires CookieConsentProvider (or equivalent) to have written state to storage.
 */

import { useCallback, useEffect, useState } from 'react'
import { Platform } from 'react-native'

import { getConsentState, NATIVE_IMPLICIT_CONSENT } from './cookieConsentStorage'

export function useCookieConsentState(): {
  isReady: boolean
  hasConsentedTo: (categoryId: string) => boolean
} {
  // Native never asks (#764) — see NATIVE_IMPLICIT_CONSENT — so it is ready
  // with that answer from the first render; only web has a stored decision.
  const isNative = Platform.OS !== 'web'
  const [state, setState] = useState<{ selections: Record<string, boolean> } | null>(
    isNative ? { selections: NATIVE_IMPLICIT_CONSENT.selections } : null
  )
  const [isReady, setIsReady] = useState(isNative)

  useEffect(() => {
    if (isNative) return
    let cancelled = false

    const load = async () => {
      const getItem = getWebStorageItem
      const parsed = await getConsentState(getItem)
      if (cancelled) return
      setState(parsed ? { selections: parsed.selections } : null)
      setIsReady(true)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [isNative])

  const hasConsentedTo = useCallback(
    (categoryId: string) => Boolean(state?.selections?.[categoryId]),
    [state]
  )

  return { isReady, hasConsentedTo }
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
