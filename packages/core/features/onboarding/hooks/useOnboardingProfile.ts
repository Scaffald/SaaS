import { useQuery } from '@tanstack/react-query'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import type { Tables } from '@app/supabase/types'

export type OnboardingProfile = {
  user: Tables<'users'> | null
  privateProfile: Tables<'user_private'> | null
}

export const useOnboardingProfile = (userId?: string | null) => {
  const supabase = useSupabase()

  return useQuery<OnboardingProfile>({
    queryKey: ['onboarding-profile', userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      if (!userId) {
        return { user: null, privateProfile: null }
      }

      const [{ data: userRow, error: userError }, { data: privateRow, error: privateError }] =
        await Promise.all([
          supabase.from('users').select('*').eq('id', userId).maybeSingle(),
          supabase.from('user_private').select('*').eq('user_id', userId).maybeSingle(),
        ])

      if (userError) throw new Error(userError.message)
      if (privateError) throw new Error(privateError.message)

      return { user: userRow ?? null, privateProfile: privateRow ?? null }
    },
  })
}
