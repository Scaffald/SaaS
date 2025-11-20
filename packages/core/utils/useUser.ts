/* c8 ignore file */

import { useQuery } from '@tanstack/react-query'
import { supabase } from './supabase/client'
import { useSessionContext } from './supabase/useSessionContext'

// Define the profile type based on the database schema
type Profile = {
  id: string
  display_name: string | null
  about: string | null
  avatar_path: string | null
  created_at: string
  updated_at: string
}

function useProfile() {
  const { session } = useSessionContext()
  const user = session?.user
  // Using supabase directly from import
  const { data, isPending, refetch } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async (): Promise<Profile | null> => {
      if (!user?.id) return null
      const { data, error } = await supabase
        .schema('core')
        .from('users')
        .select('id, display_name, about, avatar_path, created_at, updated_at')
        .eq('id', user.id)
        .single()
      if (error) {
        // PGRST116 = no rows - user deleted from database (e.g., after DB reset)
        if (error.code === 'PGRST116') {
          console.log('[useUser] User not found in database (likely after DB reset), signing out')
          await supabase.auth.signOut()
          return null
        }
        throw new Error(error.message)
      }
      return data as Profile
    },
    // Only run query if we have a user session
    enabled: !!user?.id,
  })

  // React Query returns isPending: true for disabled queries
  // We only want to report pending when the query is actually running
  const isActuallyPending = !!user?.id && isPending

  return { data, isPending: isActuallyPending, refetch }
}

export const useUser = () => {
  const { session, isLoading: isLoadingSession } = useSessionContext()
  const user = session?.user
  const { data: profile, refetch, isPending: isLoadingProfile } = useProfile()

  const avatarUrl = (() => {
    if (profile?.avatar_path) return profile.avatar_path
    if (typeof user?.user_metadata.avatar_url === 'string') {
      return user.user_metadata.avatar_url
    }

    const params = new URLSearchParams()
    const name = profile?.display_name || user?.email || ''
    params.append('name', name)
    params.append('size', '256') // will be resized again by Expo Image
    return `https://ui-avatars.com/api.jpg?${params.toString()}`
  })()

  return {
    session,
    user,
    profile,
    avatarUrl,
    updateProfile: () => refetch(),
    isLoadingSession,
    isLoadingProfile,
    isLoading: isLoadingSession || isLoadingProfile,
    isPending: isLoadingSession || isLoadingProfile,
  }
}
