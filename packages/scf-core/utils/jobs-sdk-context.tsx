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
  const { session, isLoading } = useSessionContext()
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

  // When session loading completes, invalidate SDK queries so any that ran with dummy auth refetch.
  const wasLoadingRef = useRef(isLoading)
  useEffect(() => {
    if (wasLoadingRef.current && !isLoading) {
      wasLoadingRef.current = false
      const sdkQueryKeyPrefixes = [
        'jobs',
        'applications',
        'profiles',
        'industries',
        'organizations',
        'teams',
        'prerequisites',
        'apiKeys',
        'webhooks',
        'notifications',
      ]
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey
          if (!Array.isArray(key)) return false
          // Some SDK hooks key their queries as [resource, ...] (e.g. 'profiles'),
          // others wrap them as ['scaffald', resource, ...] (e.g. 'notifications',
          // 'apiKeys') — check both shapes so queries fetched with dummy/anon auth
          // during the session-loading window actually get refetched once the
          // real session is ready, regardless of which shape the hook uses.
          const [first, second] = key
          if (typeof first === 'string' && sdkQueryKeyPrefixes.includes(first)) return true
          return (
            first === 'scaffald' &&
            typeof second === 'string' &&
            sdkQueryKeyPrefixes.includes(second)
          )
        },
      })
    }
    if (isLoading) wasLoadingRef.current = true
  }, [isLoading, queryClient])

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
