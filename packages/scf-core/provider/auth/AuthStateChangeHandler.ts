import { ROUTES } from '@scf/core/constants/routes'
import { getGlobalQueryClient } from '@scf/core/provider/react-query'
import { clearAllAuthStorage, isSessionExpired } from '@scf/core/utils/auth/clearAuthStorage'
import { supabase } from '@scf/core/utils/supabase/client'
import { useRouter } from 'expo-router'
import { useEffect } from 'react'
import type { AppStateStatus } from 'react-native'
import { AppState, Platform } from 'react-native'

const useRedirectAfterSignOut = () => {
  const router = useRouter()
  useEffect(() => {
    const signOutListener = supabase.auth.onAuthStateChange((event: string) => {
      if (event === 'SIGNED_OUT') {
        console.log('[AuthStateChangeHandler] SIGNED_OUT event - redirecting to auth')
        router.replace(ROUTES.AUTH.LOGIN.path)
      }
    })
    return () => {
      signOutListener.data.subscription.unsubscribe()
    }
  }, [router])
}

const useProactiveSessionValidation = () => {
  useEffect(() => {
    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session?.expires_at) return
        if (!isSessionExpired(session.expires_at)) return

        // SC-60 hardening: before signing the user out, try Supabase's
        // refresh path. With `autoRefreshToken: true` the SDK normally
        // refreshes silently — this fallback handles the focus-near-expiry
        // race where the timer hasn't fired yet. Only if refresh actually
        // fails do we cascade into a full sign-out.
        console.log('[AuthStateChangeHandler] Session near/past expiry; attempting refresh')
        const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession()

        if (!refreshError && refreshed?.session) {
          console.log('[AuthStateChangeHandler] Silent refresh succeeded')
          return
        }

        console.log(
          '[AuthStateChangeHandler] Refresh failed, performing comprehensive cleanup',
          refreshError?.message
        )
        const queryClient = getGlobalQueryClient()
        await clearAllAuthStorage(queryClient || undefined)
        console.log('[AuthStateChangeHandler] Cleanup completed - user will be redirected')
      } catch (error) {
        console.error('[AuthStateChangeHandler] Error checking session validity:', error)
      }
    }

    if (Platform.OS === 'web') {
      // Web: Check on visibility change
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          checkSession()
        }
      }

      document.addEventListener('visibilitychange', handleVisibilityChange)

      // Initial check on mount
      checkSession()

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
    }

    // Native: Check on app state change
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        checkSession()
      }
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange)

    // Initial check on mount
    checkSession()

    return () => {
      subscription.remove()
    }
  }, [])
}

export const AuthStateChangeHandler = () => {
  useRedirectAfterSignOut()
  useProactiveSessionValidation()
  return null
}
