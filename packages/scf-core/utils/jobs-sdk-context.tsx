/**
 * Scaffald SDK client provider built from the current Supabase session.
 * Delegates to @scaffald/sdk's ScaffaldProvider — a single Scaffald instance
 * lives in the React tree instead of a separate duplicate context.
 */

import { ScaffaldProvider, useScaffaldOrNull } from '@scaffald/sdk/react'
import { useQueryClient } from '@tanstack/react-query'
import { useMemo, useEffect, useRef, type ReactNode } from 'react'
import {
  getSupabaseAnonKey,
  getSupabaseApiBaseUrl,
  warnOnBackendMismatch,
} from './supabase/api-base-url'
import { useSessionContext } from './supabase/useSessionContext'

/** Use SDK for jobs when true. Set EXPO_PUBLIC_USE_SDK_JOBS=false to disable. */
export const USE_SDK_FOR_JOBS =
  typeof process === 'undefined' || process.env?.EXPO_PUBLIC_USE_SDK_JOBS !== 'false'

/**
 * Wraps children with ScaffaldProvider using the current session's access token.
 * Must be used inside AuthProvider (SessionContext) and inside a QueryClientProvider.
 *
 * Passes the existing QueryClient through to ScaffaldProvider so no additional
 * QueryClientProvider is added to the tree.
 */
export function ScaffaldJobsSdkProviderFromSession({ children }: { children: ReactNode }) {
  // isLoading is no longer read: the cache-recovery effect below keys off the
  // access token itself, which covers both the initial load and every later
  // refresh, where the loading flag only ever covered the first (#579).
  const { session } = useSessionContext()
  const baseUrl = useMemo(getSupabaseApiBaseUrl, [])
  const anonKey = useMemo(getSupabaseAnonKey, [])
  // Re-use the QueryClient already in the tree — avoids a duplicate QueryClientProvider.
  const queryClient = useQueryClient()

  warnOnBackendMismatch()

  const config = useMemo(() => {
    if (!baseUrl) {
      return { baseUrl: 'https://api.scaffald.com', apiKey: 'dummy' }
    }
    // anonKey is plumbed through the SDK's typed config so HttpClient sends
    // the `apikey` header that Supabase Kong requires on /functions/v1/*.
    // Use valid credentials whenever available, even while loading.
    // Fall back to anonKey or dummy so the context always has a non-null client —
    // otherwise hooks using useScaffald() throw during the loading window because
    // this inner provider shadows the outer ScaffaldProviderFromSession context.
    const token = session?.access_token?.trim()
    if (token) return { baseUrl, supabaseToken: token, anonKey }
    if (anonKey) return { baseUrl, anonKey }
    return { baseUrl, apiKey: 'dummy' }
  }, [session?.access_token, baseUrl, anonKey])

  // Any change to the access token means everything already in the cache was
  // fetched with a credential that is no longer current — either the anon/dummy
  // fallback above during the loading window, or a token that has since been
  // refreshed. Invalidate unconditionally and let react-query refetch whatever
  // is actually mounted.
  //
  // This used to key off the isLoading true->false transition and filter by a
  // hand-maintained list of ten query-key prefixes. Both halves failed (#579):
  // a token that expired while the tab was open never produced a transition, and
  // scf-core registers 30+ key roots, so /profiles/employment, /resume/has-uploaded,
  // /profiles/import/data and the rest stayed 401 for the life of the page. An
  // allow-list that has to be updated every time a hook is added will drift
  // again; not having one cannot.
  const previousTokenRef = useRef<string | undefined>(undefined)
  useEffect(() => {
    const token = session?.access_token?.trim() || undefined
    if (previousTokenRef.current === token) return
    previousTokenRef.current = token
    // Sign-out is handled by clearAllAuthStorage, which resets the whole cache.
    if (!token) return
    void queryClient.invalidateQueries()
  }, [session?.access_token, queryClient])

  // Always render ScaffaldProvider so the tree structure never changes.
  // Switching between <>{children}</> and <ScaffaldProvider> causes the entire
  // Stack (NativeStackNavigator) to unmount/remount, firing all navigation
  // effects at once and exceeding React's max update depth.
  return (
    <ScaffaldProvider config={config} queryClient={queryClient}>
      {children}
    </ScaffaldProvider>
  )
}

/**
 * Returns the Scaffald client from context, or null if no provider is present.
 * All sdk-hooks files use this — delegating to useScaffaldOrNull() keeps
 * their null-returning contract unchanged.
 */
export function useScaffaldJobsClient() {
  return useScaffaldOrNull()
}
