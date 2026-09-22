/**
 * Whether a screen's header is collapsed, remembered per screen.
 *
 * The rule, from the SCF prototype's second audit ("screen headers wake up
 * differently"): every screen opens **expanded** on first visit, and collapse
 * is a choice the screen remembers. The prototype had two different first-run
 * defaults across its screens and read as two header designs because of it.
 *
 * Storage is per screen key, so collapsing the tip on Applications does not
 * collapse it on Jobs — they are different tips. An unreadable or empty store
 * means expanded, which is the first-visit answer anyway.
 */

import AsyncStorage from '@react-native-async-storage/async-storage'
import { useCallback, useEffect, useState } from 'react'

const KEY_PREFIX = '@scaffald:screen_header_collapsed:'

export function useScreenHeaderCollapse(screenKey: string | null) {
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    if (!screenKey) return
    let cancelled = false
    ;(async () => {
      try {
        const stored = await AsyncStorage.getItem(`${KEY_PREFIX}${screenKey}`)
        if (!cancelled && stored === 'true') setCollapsed(true)
      } catch {
        // Expanded is the first-visit state; a failed read lands there too.
      }
    })()
    return () => {
      cancelled = true
    }
  }, [screenKey])

  const toggleCollapsed = useCallback(() => {
    if (!screenKey) return
    setCollapsed((previous) => {
      const next = !previous
      // Best-effort: the visible state has already changed, and a failed
      // write only costs the preference on the next visit.
      void AsyncStorage.setItem(`${KEY_PREFIX}${screenKey}`, String(next)).catch(() => {})
      return next
    })
  }, [screenKey])

  return { collapsed, toggleCollapsed }
}
