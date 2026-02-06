/**
 * Optional Scaffald SDK client for jobs (and future API) when migrating from tRPC.
 * When USE_SDK_FOR_JOBS is true and a client is provided, jobs hooks use the SDK instead of tRPC.
 */

import { Scaffald } from '@scaffald/sdk'
import { createContext, useContext, useMemo, type ReactNode } from 'react'
import Constants from 'expo-constants'
import { useSessionContext } from './supabase/useSessionContext'

/** Use SDK for jobs when true and client is set. Set EXPO_PUBLIC_USE_SDK_JOBS=false to disable. */
export const USE_SDK_FOR_JOBS =
  typeof process === 'undefined' || process.env?.EXPO_PUBLIC_USE_SDK_JOBS !== 'false'

function getSupabaseApiBaseUrl(): string {
  const supabaseExtra = (Constants?.expoConfig?.extra as { supabase?: { url?: string } })?.supabase
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? supabaseExtra?.url
  if (!url) return ''
  return `${url.replace(/\/$/, '')}/functions/v1/api`
}

function getSupabaseAnonKey(): string {
  const supabaseExtra = (Constants?.expoConfig?.extra as { supabase?: { anonKey?: string } })?.supabase
  return process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? supabaseExtra?.anonKey ?? ''
}

const ScaffaldJobsSdkContext = createContext<Scaffald | null>(null)

export interface ScaffaldJobsSdkProviderProps {
  client: Scaffald | null
  children: ReactNode
}

/**
 * Provides an optional Scaffald SDK client for jobs. When USE_SDK_FOR_JOBS is true
 * and client is non-null, jobs hooks (e.g. useJobBySlug) use the SDK; otherwise they use tRPC.
 */
export function ScaffaldJobsSdkProvider({ client, children }: ScaffaldJobsSdkProviderProps) {
  return (
    <ScaffaldJobsSdkContext.Provider value={client}>
      {children}
    </ScaffaldJobsSdkContext.Provider>
  )
}

/**
 * Wraps children with ScaffaldJobsSdkProvider using the current session's access token.
 * Must be used inside AuthProvider (SessionContext). When USE_SDK_FOR_JOBS is true,
 * jobs hooks will use the SDK for requests.
 */
export function ScaffaldJobsSdkProviderFromSession({ children }: { children: ReactNode }) {
  const { session } = useSessionContext()
  const baseUrl = useMemo(getSupabaseApiBaseUrl, [])
  const anonKey = useMemo(getSupabaseAnonKey, [])
  const client = useMemo(() => {
    if (!baseUrl) return null
    const token = session?.access_token?.trim()
    const auth = token ? { accessToken: token } : anonKey ? { apiKey: anonKey } : null
    if (!auth) return null
    try {
      return new Scaffald({ ...auth, baseUrl })
    } catch {
      return null
    }
  }, [session?.access_token, baseUrl, anonKey])

  return <ScaffaldJobsSdkProvider client={client}>{children}</ScaffaldJobsSdkProvider>
}

export function useScaffaldJobsClient(): Scaffald | null {
  return useContext(ScaffaldJobsSdkContext)
}
