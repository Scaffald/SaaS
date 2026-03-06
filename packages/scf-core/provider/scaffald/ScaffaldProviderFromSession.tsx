/**
 * Wraps ScaffaldProvider from @scaffald/sdk with session-aware config.
 * Required for @scaffald/sdk/react hooks (usePrerequisites, useTeams, etc.).
 * Must be used inside AuthProvider.
 */

import { ScaffaldProvider } from '@scaffald/sdk/react'
import type { ReactNode } from 'react'
import Constants from 'expo-constants'
import { useMemo } from 'react'
import { useSessionContext } from '../../utils/supabase/useSessionContext'

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

export function ScaffaldProviderFromSession({ children }: { children: ReactNode }) {
  const { session, isLoading } = useSessionContext()
  const baseUrl = useMemo(getSupabaseApiBaseUrl, [])
  const anonKey = useMemo(getSupabaseAnonKey, [])

  const config = useMemo(() => {
    if (!baseUrl) {
      return { baseUrl: 'https://api.scaffald.com', apiKey: 'dummy' }
    }
    // Do not pass anon key while session is loading so authenticated routes
    // don't fire requests with anon key and get 401. Once session is resolved,
    // we use token for authenticated users or anon key for public/unauthenticated.
    if (isLoading) {
      return { baseUrl }
    }
    const token = session?.access_token?.trim()
    if (token) {
      return { baseUrl, supabaseToken: token }
    }
    if (anonKey) {
      return { baseUrl, apiKey: anonKey }
    }
    return { baseUrl, apiKey: 'dummy' }
  }, [baseUrl, isLoading, session?.access_token, anonKey])

  return <ScaffaldProvider config={config}>{children}</ScaffaldProvider>
}
