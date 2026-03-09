/**
 * Scaffald SDK client provider built from the current Supabase session.
 * Delegates to @scaffald/sdk's ScaffaldProvider — a single Scaffald instance
 * lives in the React tree instead of a separate duplicate context.
 */

import { ScaffaldProvider, useScaffaldOrNull } from '@scaffald/sdk/react'
import { useQueryClient } from '@tanstack/react-query'
import { useMemo, useEffect, useRef, type ReactNode } from 'react'
import Constants from 'expo-constants'
import { useSessionContext } from './supabase/useSessionContext'

/** Use SDK for jobs when true. Set EXPO_PUBLIC_USE_SDK_JOBS=false to disable. */
export const USE_SDK_FOR_JOBS =
  typeof process === 'undefined' || process.env?.EXPO_PUBLIC_USE_SDK_JOBS !== 'false'

function getSupabaseApiBaseUrl(): string {
  // Explicit override for API URL (must include /functions/v1/api for local Supabase)
  const explicitApiUrl = process.env.EXPO_PUBLIC_SCAFFALD_API_URL
  if (explicitApiUrl?.trim()) return explicitApiUrl.replace(/\/$/, '')

  const supabaseExtra = (Constants?.expoConfig?.extra as { supabase?: { url?: string } })?.supabase
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? supabaseExtra?.url
  if (!url) return ''
  const base = url.replace(/\/$/, '')
  // Already includes API path (avoid double-append)
  if (base.endsWith('/functions/v1/api')) return base
  // Local Supabase API is at /functions/v1/api - requests to /v1/* alone hit Kong with no CORS
  return `${base}/functions/v1/api`
}

function getSupabaseAnonKey(): string {
  const supabaseExtra = (Constants?.expoConfig?.extra as { supabase?: { anonKey?: string } })
    ?.supabase
  return process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? supabaseExtra?.anonKey ?? ''
}

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

  const config = useMemo(() => {
    if (!baseUrl) return { baseUrl: 'https://api.scaffald.com', apiKey: 'dummy' }
    // Use valid credentials whenever available, even while loading (e.g. initialSession).
    // Only use dummy when we have no token and no anon key yet.
    const token = session?.access_token?.trim()
    if (token) return { baseUrl, supabaseToken: token }
    if (anonKey) return { baseUrl, apiKey: anonKey }
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
      ]
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey
          return (
            Array.isArray(key) &&
            typeof key[0] === 'string' &&
            sdkQueryKeyPrefixes.includes(key[0])
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
