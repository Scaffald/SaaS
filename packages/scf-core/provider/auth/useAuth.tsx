import { useSessionContext } from '@scf/core/utils/supabase/useSessionContext'
import type { SessionContextHelper } from './AuthProvider'

/**
 * Modern useAuth hook for consuming authentication state
 *
 * Features:
 * - Type-safe access to session, user, and auth methods
 * - Built-in error handling
 * - Loading state management
 * - Enhanced utility methods
 *
 * @returns SessionContextHelper with auth state and methods
 * @throws Error if used outside AuthProvider
 */
export const useAuth = (): SessionContextHelper => useSessionContext()

/**
 * Utility hook that returns just the current user
 * Convenience method for components that only need user data
 */
export const useUser = () => {
  const { session } = useAuth()
  return session?.user || null
}

/**
 * Utility hook that returns authentication status
 * Convenience method for conditional rendering
 */
export const useAuthStatus = () => {
  const { session, isLoading } = useAuth()

  return {
    isAuthenticated: !!session,
    isLoading,
    isLoggedOut: !session && !isLoading,
  }
}

/**
 * Enhanced hook with additional utility methods
 * For advanced authentication workflows
 */
export const useAuthAdvanced = () => {
  const authContext = useAuth()
  const { session, signOut, refreshSession } = authContext

  return {
    ...authContext,

    // Utility getters
    user: session?.user || null,
    isAuthenticated: !!session,
    isAnonymous: !session,

    // Enhanced methods
    signOutAsync: async () => {
      try {
        await signOut()
        return { success: true, error: null }
      } catch (err) {
        console.error('Sign out failed:', err)
        return { success: false, error: err }
      }
    },

    refreshSessionAsync: async () => {
      try {
        await refreshSession()
        return { success: true, error: null }
      } catch (err) {
        console.error('Session refresh failed:', err)
        return { success: false, error: err }
      }
    },

    // User profile helpers
    getUserId: () => session?.user?.id || null,
    getUserEmail: () => session?.user?.email || null,
    getUserMetadata: () => session?.user?.user_metadata || {},

    // Session helpers
    getAccessToken: () => session?.access_token || null,
    isSessionExpired: () => {
      if (!session) return true
      const now = Date.now() / 1000
      return session.expires_at ? now > session.expires_at : false
    },
  }
}
