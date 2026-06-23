/**
 * Persisted Workers/Employers app mode (v1.12.0 / SC-136). Survives reloads via
 * AsyncStorage (web localStorage / native). The selected employer org slug is
 * remembered so re-entering employer mode lands on the same org.
 */
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useCallback, useEffect, useState } from 'react'

export type AppMode = 'worker' | 'employer'

const MODE_KEY = '@scaffald:app_mode'
const ORG_SLUG_KEY = '@scaffald:app_mode_org_slug'

export function useAppMode() {
  const [mode, setMode] = useState<AppMode>('worker')
  const [orgSlug, setOrgSlug] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [savedMode, savedSlug] = await Promise.all([
          AsyncStorage.getItem(MODE_KEY),
          AsyncStorage.getItem(ORG_SLUG_KEY),
        ])
        if (cancelled) return
        if (savedMode === 'employer' || savedMode === 'worker') setMode(savedMode)
        if (savedSlug) setOrgSlug(savedSlug)
      } catch {
        // best-effort; default to worker
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const setAppMode = useCallback(async (next: AppMode, slug?: string | null) => {
    setMode(next)
    try {
      await AsyncStorage.setItem(MODE_KEY, next)
      if (slug) {
        setOrgSlug(slug)
        await AsyncStorage.setItem(ORG_SLUG_KEY, slug)
      }
    } catch {
      // best-effort
    }
  }, [])

  return { mode, orgSlug, isLoading, setAppMode }
}
