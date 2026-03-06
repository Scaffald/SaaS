import { supabase } from '@scf/core/utils/supabase/client'
import { ROUTES } from '@scf/core/constants/routes'
import { useRouter } from 'expo-router'
import { useEffect } from 'react'

/**
 * OAuth callback handler for web PKCE flow.
 * After Google OAuth redirects to /auth/callback?code=..., supabase-js
 * automatically exchanges the code for a session via detectSessionInUrl.
 * We wait for the SIGNED_IN event before navigating so AuthProvider's
 * React state is updated before any downstream SDK hooks run.
 */
export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
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
