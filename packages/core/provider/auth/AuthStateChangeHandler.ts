import { useSupabase } from '@app/core/utils/supabase/useSupabase'
import { useEffect } from 'react'
import { useRouter } from 'solito/router'
import { ROUTES } from '@app/core/constants/routes'

const useRedirectAfterSignOut = () => {
  const supabase = useSupabase()
  const router = useRouter()
  useEffect(() => {
    const signOutListener = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        router.replace(ROUTES.AUTH)
      }
    })
    return () => {
      signOutListener.data.subscription.unsubscribe()
    }
  }, [supabase, router])
}

export const AuthStateChangeHandler = () => {
  useRedirectAfterSignOut()
  return null
}
