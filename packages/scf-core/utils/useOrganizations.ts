/* c8 ignore file */

import { useQuery } from '@tanstack/react-query'

import {
  mergeOrganizationMemberships,
  type OrgRoleAssignmentRow,
  type OwnedOrganizationRow,
  type TeamMembershipRow,
} from './organization-memberships'
import { supabase } from './supabase/client'
import { useUser } from './useUser'

export type { OrganizationMembership, OrganizationRole } from './organization-memberships'

/**
 * The organisations the signed-in person belongs to: through a team, as the
 * owner, or through a role scoped to the organisation (#1312). It read teams
 * only, so an owner or admin who was on no team had no organisations, no
 * Employer mode, and no way into their own pipeline.
 *
 * RLS admits all three reads: organisations are readable by any signed-in
 * user, and a person may read their own role assignments.
 */
export const useOrganizations = () => {
  const { user } = useUser()

  return useQuery({
    queryKey: ['organizations', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      if (!user?.id) {
        return []
      }

      const coreClient = supabase.schema<'core'>('core')

      const [teams, owned, roles] = await Promise.all([
        coreClient
          .from('team_members')
          .select('user_id, created_at, teams!inner(organizations!inner(id, name, slug))')
          .eq('user_id', user.id),
        coreClient
          .from('organizations')
          .select('id, name, slug, created_at')
          .eq('owner_user_id', user.id),
        coreClient
          .from('role_assignments')
          .select(
            'created_at, role:roles!role_id(name), organization:organizations!scope_org_id(id, name, slug)'
          )
          .eq('user_id', user.id)
          .not('scope_org_id', 'is', null),
      ])

      // Any one failing is a failure, not a shorter list: a missing source
      // would quietly drop Employer mode for exactly the people it is for.
      for (const result of [teams, owned, roles]) {
        if (result.error) throw new Error(result.error.message)
      }

      return mergeOrganizationMemberships(user.id, {
        teams: teams.data as unknown as TeamMembershipRow[],
        owned: owned.data as unknown as OwnedOrganizationRow[],
        roles: roles.data as unknown as OrgRoleAssignmentRow[],
      })
    },
  })
}
