/**
 * Wraps ScaffaldProvider from @scaffald/sdk with session-aware config.
 * Required for @scaffald/sdk/react hooks (usePrerequisites, useTeams, etc.).
 * Must be used inside AuthProvider.
 */

import { ScaffaldProvider } from '@scaffald/sdk/react'
import type { ReactNode } from 'react'
import { useMemo } from 'react'
import {
  getSupabaseAnonKey,
  getSupabaseApiBaseUrl,
  warnOnBackendMismatch,
} from '../../utils/supabase/api-base-url'
import { useSessionContext } from '../../utils/supabase/useSessionContext'

export function ScaffaldProviderFromSession({ children }: { children: ReactNode }) {
  const { session } = useSessionContext()
  const baseUrl = useMemo(getSupabaseApiBaseUrl, [])
  const anonKey = useMemo(getSupabaseAnonKey, [])

  warnOnBackendMismatch()

  const config = useMemo(() => {
    if (!baseUrl) {
      return { baseUrl: 'https://api.scaffald.com', apiKey: 'dummy' }
    }
    // Use valid credentials whenever available, even while loading (e.g. initialSession).
    // Only use dummy when we have no token and no anon key yet.
    const token = session?.access_token?.trim()
    if (token) {
      return { baseUrl, supabaseToken: token }
    }
    if (anonKey) {
      return { baseUrl, apiKey: anonKey }
    }
    return { baseUrl, apiKey: 'dummy' }
  }, [baseUrl, session?.access_token, anonKey])

  return <ScaffaldProvider config={config}>{children}</ScaffaldProvider>
}
