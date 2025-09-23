import { useQuery } from '@tanstack/react-query'

import { Database } from '@app/supabase/types'

import { isNotFoundPostgrestError, wrapSupabaseError } from './supabase/errors'
import { useSupabase } from './supabase/useSupabase'
import { useUser } from './useUser'

export type OrganizationMembership =
  Database['public']['Views']['v_organization_memberships']['Row']

export const useOrganizations = () => {
  const supabase = useSupabase()
  const { user } = useUser()

  return useQuery({
    queryKey: ['organizations', user?.id],
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<OrganizationMembership[]> => {
      if (!user?.id) {
        return []
      }

      const { data, error } = await supabase
        .from('v_organization_memberships')
        .select('*')
        .eq('user_id', user.id)
        .order('organization_name', { ascending: true })

      if (error) {
        if (isNotFoundPostgrestError(error)) {
          return []
        }

        throw wrapSupabaseError(error)
      }

      return data ?? []
    },
  })
}
