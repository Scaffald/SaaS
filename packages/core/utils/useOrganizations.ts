import { useQuery } from '@tanstack/react-query'

import { Database } from '@app/supabase/types'

import { supabase } from './supabase/client'
import { useUser } from './useUser'

export type OrganizationMembership =
  Database['public']['Views']['v_organization_memberships']['Row']

export const useOrganizations = () => {
  // Using supabase directly from import
  const { user } = useUser()

  return useQuery({
    queryKey: ['organizations', user?.id],
    enabled: !!user?.id,
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
        throw new Error(error.message)
      }

      return data ?? []
    },
  })
}
