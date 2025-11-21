import { SessionContext, type SessionContextHelper } from '@app/core/provider/auth/AuthProvider'
import { supabase } from '@app/core/utils/supabase/client'
import { useContext } from 'react'

const fallbackSessionContext: SessionContextHelper = {
  session: null,
  error: null,
  isLoading: true,
  supabaseClient: supabase,
  signOut: async () => {
    if (__DEV__) {
      console.warn('[useSessionContext] signOut called without SessionContext provider')
    }
  },
  clearAuth: async () => {
    if (__DEV__) {
      console.warn('[useSessionContext] clearAuth called without SessionContext provider')
    }
  },
  refreshSession: async () => {
    if (__DEV__) {
      console.warn('[useSessionContext] refreshSession called without SessionContext provider')
    }
  },
}

/**
 * Unified useSessionContext hook that works with our unified AuthProvider
 * This replaces the @supabase/auth-helpers-react version
 */
export const useSessionContext = () => {
  const context = useContext(SessionContext)

  if (!context) {
    if (__DEV__) {
      console.warn(
        '[useSessionContext] SessionContext provider missing. Returning fallback context to avoid runtime crash.'
      )
    }

    return fallbackSessionContext
  }

  return context
}
