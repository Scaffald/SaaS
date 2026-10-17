/**
 * Persisted Workers/Employers app mode (v1.12.0 / SC-136). Survives reloads via
 * AsyncStorage (web localStorage / native). The selected employer org slug is
 * remembered so re-entering employer mode lands on the same org.
 *
 * One shared store, not state per hook. Every caller used to hold its own copy,
 * so switching mode in the account row changed that row and nothing else: the
 * phone bar, and now the drawer and section tabs, kept the old mode until they
 * happened to remount (#1157 — navigation follows the mode, so it has to hear
 * about the change).
 */
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useCallback, useEffect, useSyncExternalStore } from 'react'

export type AppMode = 'worker' | 'employer'

const MODE_KEY = '@scaffald:app_mode'
const ORG_SLUG_KEY = '@scaffald:app_mode_org_slug'

type AppModeState = { mode: AppMode; orgSlug: string | null; isLoading: boolean }

let state: AppModeState = { mode: 'worker', orgSlug: null, isLoading: true }
const listeners = new Set<() => void>()
let loadStarted = false

const emit = (next: Partial<AppModeState>) => {
  state = { ...state, ...next }
  for (const listener of listeners) listener()
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

const getSnapshot = () => state
// The server render has no storage; it renders worker mode, as before.
const SERVER_STATE: AppModeState = { mode: 'worker', orgSlug: null, isLoading: true }
const getServerSnapshot = () => SERVER_STATE

const load = () => {
  if (loadStarted) return
  loadStarted = true
  ;(async () => {
    try {
      const [savedMode, savedSlug] = await Promise.all([
        AsyncStorage.getItem(MODE_KEY),
        AsyncStorage.getItem(ORG_SLUG_KEY),
      ])
      emit({
        ...(savedMode === 'employer' || savedMode === 'worker' ? { mode: savedMode } : {}),
        ...(savedSlug ? { orgSlug: savedSlug } : {}),
        isLoading: false,
      })
    } catch {
      // best-effort; default to worker
      emit({ isLoading: false })
    }
  })()
}

export function useAppMode() {
  const { mode, orgSlug, isLoading } = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  )

  useEffect(load, [])

  const setAppMode = useCallback(async (next: AppMode, slug?: string | null) => {
    emit({ mode: next, ...(slug ? { orgSlug: slug } : {}) })
    try {
      await AsyncStorage.setItem(MODE_KEY, next)
      if (slug) await AsyncStorage.setItem(ORG_SLUG_KEY, slug)
    } catch {
      // best-effort
    }
  }, [])

  return { mode, orgSlug, isLoading, setAppMode }
}
