import { supabase } from '@scf/core/utils/supabase/client'
import { ROUTES } from '@scf/core/constants/routes'
import { captureEvent } from '@scf/core/utils/analytics/client'
import { readOAuthErrorParams } from '@scf/core/features/auth/utils/oauthCallback'
import { useRouter } from 'expo-router'
import { useEffect } from 'react'
import { Platform } from 'react-native'

/**
 * OAuth callback handler.
 *
 * Web PKCE flow: Supabase redirects here as `/auth/callback?code=...` after
 * the provider round-trip and supabase-js auto-exchanges the code via
 * `detectSessionInUrl`. We wait for `SIGNED_IN` before navigating so the
 * AuthProvider state is up to date for downstream hooks.
 *
 * Failure handling: Supabase can also redirect here with
 * `?error=...&error_description=...` (e.g. expired Apple client secret,
 * redirect-URI mismatch). In that case we forward the params to the login
 * screen so the user sees a toast instead of a silent bounce — see SC-60.
 */
export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const errorParams =
      Platform.OS === 'web' && typeof window !== 'undefined'
        ? readOAuthErrorParams(window.location.search, window.location.hash)
        : null

    if (errorParams) {
      captureEvent('auth_callback_failed', {
        error: errorParams.error ?? null,
        error_code: errorParams.errorCode ?? null,
        error_description: errorParams.errorDescription ?? null,
      })
      router.replace({
        pathname: ROUTES.AUTH.LOGIN.path,
        params: {
          oauth_error: errorParams.error ?? '',
          oauth_error_code: errorParams.errorCode ?? '',
          oauth_error_description: errorParams.errorDescription ?? '',
        },
      })
      return
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        subscription.unsubscribe()
        router.replace(ROUTES.HOME.path)
      } else if (event === 'SIGNED_OUT' || (event === 'INITIAL_SESSION' && !session)) {
        subscription.unsubscribe()
        router.replace(ROUTES.AUTH.LOGIN.path)
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  return null
}
