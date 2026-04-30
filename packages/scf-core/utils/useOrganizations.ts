/* c8 ignore file */

import type { Database } from '@scf/supabase/types'
import { useQuery } from '@tanstack/react-query'

import { supabase } from './supabase/client'
import { useUser } from './useUser'

type TeamMemberRow = Database['core']['Tables']['team_members']['Row']
type OrganizationRow = Database['core']['Tables']['organizations']['Row']

type JoinedTeamMember = Pick<TeamMemberRow, 'user_id' | 'created_at'> & {
  teams: {
    organizations: Pick<OrganizationRow, 'id' | 'name' | 'slug'> | null
  } | null
}

export type OrganizationMembership = {
  organization_id: string
  organization_name: string
  organization_slug: string
  user_id: string
  role: string
  joined_at: string
}

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

      const coreClient = supabase.schema<'core'>('core')

      const { data, error } = await coreClient
        .from('team_members')
        .select(`
          user_id,
          created_at,
          teams!inner(
            organizations!inner(
              id,
              name,
              slug
            )
          )
        `)
        .eq('user_id', user.id)

      if (error) {
        throw new Error(error.message)
      }

      const memberships = (data ?? []) as JoinedTeamMember[]

      const all = memberships
        .map((item) => {
          const organization = item.teams?.organizations

          if (!organization) {
            return null
          }

          return {
            organization_id: organization.id,
            organization_name: organization.name ?? '',
            organization_slug: organization.slug ?? '',
            user_id: item.user_id,
            role: 'member',
            joined_at: item.created_at,
          } satisfies OrganizationMembership
        })
        .filter((membership): membership is OrganizationMembership => membership !== null)

      // A user can belong to multiple teams within the same organization; the
      // org list should show each org once. Keep the earliest joined_at as the
      // canonical entry so sorts/filters are stable.
      const byOrg = new Map<string, OrganizationMembership>()
      for (const m of all) {
        const existing = byOrg.get(m.organization_id)
        if (!existing || m.joined_at < existing.joined_at) {
          byOrg.set(m.organization_id, m)
        }
      }
      return Array.from(byOrg.values()).sort((a, b) =>
        a.organization_name.localeCompare(b.organization_name)
      )
    },
  })
}
