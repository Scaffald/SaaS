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
 *
 * The mode belongs to a user (#1354). It is stored with its owner's id and
 * only restored for that user; on SIGNED_OUT, or when a different user signs
 * in, the mode drops back to worker and the stored keys are removed. Before,
 * a worker signing in on a browser an employer had used opened in the
 * employer view.
 */
import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from '@scf/core/utils/supabase/client'
import { useCallback, useEffect, useSyncExternalStore } from 'react'

export type AppMode = 'worker' | 'employer'

const MODE_KEY = '@scaffald:app_mode'
const ORG_SLUG_KEY = '@scaffald:app_mode_org_slug'
const OWNER_KEY = '@scaffald:app_mode_owner'

type AppModeState = { mode: AppMode; orgSlug: string | null; isLoading: boolean }

const WORKER: AppModeState = { mode: 'worker', orgSlug: null, isLoading: false }

let state: AppModeState = { mode: 'worker', orgSlug: null, isLoading: true }
const listeners = new Set<() => void>()
let loadStarted = false

/** What storage holds; mirrored in memory so auth changes can re-check it. */
type Stored = { mode: AppMode | null; orgSlug: string | null; owner: string | null }
let stored: Stored = { mode: null, orgSlug: null, owner: null }
/** Bumped on every in-memory write, so a slow storage read can't undo it. */
let storedVersion = 0
let storageLoaded = false
/** The signed-in user's id; `undefined` until auth has reported. */
let currentUserId: string | null | undefined
/** The mode was switched before auth reported; give it to the first user seen. */
let claimOnAuth = false

const emit = (next: Partial<AppModeState>) => {
  const merged = { ...state, ...next }
  if (
    merged.mode === state.mode &&
    merged.orgSlug === state.orgSlug &&
    merged.isLoading === state.isLoading
  ) {
    return
  }
  state = merged
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

const clearStored = () => {
  const hadAny = stored.mode !== null || stored.orgSlug !== null || stored.owner !== null
  stored = { mode: null, orgSlug: null, owner: null }
  storedVersion++
  if (!hadAny && storageLoaded) return
  AsyncStorage.multiRemove([MODE_KEY, ORG_SLUG_KEY, OWNER_KEY]).catch(() => {
    // best-effort
  })
}

/**
 * Settle the visible mode once both storage and auth have reported: restore
 * the stored mode only for the user who stored it.
 */
const reconcile = () => {
  if (!storageLoaded || currentUserId === undefined) return
  if (claimOnAuth && currentUserId !== null && stored.mode && stored.owner === null) {
    stored = { ...stored, owner: currentUserId }
    AsyncStorage.setItem(OWNER_KEY, currentUserId).catch(() => {
      // best-effort
    })
  }
  claimOnAuth = false
  if (currentUserId === null) {
    // Nobody is signed in yet (or auth resolved late): show worker, but keep
    // the stored mode in case its owner is the one about to sign in.
    emit(WORKER)
    return
  }
  if (stored.mode && stored.owner === currentUserId) {
    emit({ mode: stored.mode, orgSlug: stored.orgSlug, isLoading: false })
    return
  }
  // Stored for someone else, or written before owners were recorded.
  clearStored()
  emit(WORKER)
}

/**
 * Feed an auth change into the store. Exported for tests; the module
 * subscribes to supabase auth itself.
 */
export const handleAppModeAuthChange = (event: string, userId: string | null) => {
  if (event === 'SIGNED_OUT') {
    currentUserId = null
    claimOnAuth = false
    clearStored()
    emit(storageLoaded ? WORKER : { mode: 'worker', orgSlug: null })
    return
  }
  currentUserId = userId
  reconcile()
}

const subscribeToAuth = () => {
  try {
    supabase.auth.onAuthStateChange((event: string, session: { user?: { id?: string } } | null) => {
      handleAppModeAuthChange(event, session?.user?.id ?? null)
    })
  } catch {
    // No auth client (missing env in a test, say): nobody is signed in.
    handleAppModeAuthChange('INITIAL_SESSION', null)
  }
}

const load = () => {
  if (loadStarted) return
  loadStarted = true
  subscribeToAuth()
  const versionAtRead = storedVersion
  ;(async () => {
    try {
      const [savedMode, savedSlug, savedOwner] = await Promise.all([
        AsyncStorage.getItem(MODE_KEY),
        AsyncStorage.getItem(ORG_SLUG_KEY),
        AsyncStorage.getItem(OWNER_KEY),
      ])
      // A sign-out or mode switch that landed while storage was loading is
      // newer than what was read; keep it.
      if (storedVersion === versionAtRead) {
        stored = {
          mode: savedMode === 'employer' || savedMode === 'worker' ? savedMode : null,
          orgSlug: savedSlug || null,
          owner: savedOwner || null,
        }
      }
    } catch {
      // best-effort; default to worker
    }
    storageLoaded = true
    reconcile()
  })()
}

/** Test-only: forget everything so each test starts from a fresh page load. */
export const __resetAppModeForTests = () => {
  state = { mode: 'worker', orgSlug: null, isLoading: true }
  stored = { mode: null, orgSlug: null, owner: null }
  storedVersion = 0
  storageLoaded = false
  currentUserId = undefined
  claimOnAuth = false
  loadStarted = false
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
    const owner = currentUserId ?? null
    claimOnAuth = currentUserId === undefined
    stored = { mode: next, orgSlug: slug || stored.orgSlug, owner }
    storedVersion++
    try {
      await AsyncStorage.setItem(MODE_KEY, next)
      if (slug) await AsyncStorage.setItem(ORG_SLUG_KEY, slug)
      // Without a known user the mode is not restored on the next load.
      if (owner) await AsyncStorage.setItem(OWNER_KEY, owner)
      else await AsyncStorage.removeItem(OWNER_KEY)
    } catch {
      // best-effort
    }
  }, [])

  return { mode, orgSlug, isLoading, setAppMode }
}
