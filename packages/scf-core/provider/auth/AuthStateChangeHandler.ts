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

        if (session?.expires_at) {
          const expired = isSessionExpired(session.expires_at)

          if (expired) {
            console.log('[AuthStateChangeHandler] Session expired detected on app focus')
            console.log('[AuthStateChangeHandler] Triggering comprehensive cleanup')

            const queryClient = getGlobalQueryClient()
            await clearAllAuthStorage(queryClient || undefined)

            console.log('[AuthStateChangeHandler] Cleanup completed - user will be redirected')
          }
        }
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
