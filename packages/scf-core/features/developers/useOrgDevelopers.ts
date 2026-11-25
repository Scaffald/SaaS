/* c8 ignore file */

import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { supabase } from '@scf/core/utils/supabase/client'
import { useOrganizations } from '@scf/core/utils/useOrganizations'
import { useUser } from '@scf/core/utils/useUser'
import { canManageOrgDevelopers } from './access'

type TeamRoleRow = {
  team: { organization_id: string | null } | { organization_id: string | null }[] | null
  role: { key: string | null } | { key: string | null }[] | null
}

const one = <T>(value: T | T[] | null | undefined): T | null =>
  Array.isArray(value) ? (value[0] ?? null) : (value ?? null)

/**
 * The organization a Developers screen is for, from the slug in its URL, and
 * whether the viewer may manage its keys and webhooks.
 *
 * `useOrganizations` already says owner / admin / member; a `team_admin` on one
 * of its teams reads there as a plain member, so the viewer's team roles are
 * read here too. Until they arrive `canManage` is false: the controls appear
 * late rather than flash and vanish.
 */
export function useOrgDevelopers(slug: string | undefined) {
  const { user } = useUser()
  // isPending, not isLoading: the query waits, disabled, for the user, and a
  // disabled query reports isLoading false — a flash of "not found".
  const { data: memberships, isPending, error } = useOrganizations()
  const isLoading = isPending && !error

  const membership = useMemo(
    () => memberships?.find((m) => m.organization_slug === slug) ?? null,
    [memberships, slug]
  )
  const organizationId = membership?.organization_id

  const teamRoles = useQuery({
    queryKey: ['organizations', user?.id, 'team-roles', organizationId],
    enabled: !!user?.id && !!organizationId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error: teamError } = await supabase
        .schema<'core'>('core')
        .from('team_members')
        .select('team:teams(organization_id), role:team_roles(key)')
        .eq('user_id', user?.id ?? '')
      if (teamError) throw new Error(teamError.message)
      return ((data ?? []) as unknown as TeamRoleRow[])
        .filter((row) => one(row.team)?.organization_id === organizationId)
        .map((row) => one(row.role)?.key ?? null)
    },
  })

  const org = membership
    ? {
        organizationId: membership.organization_id,
        organizationName: membership.organization_name,
        slug: membership.organization_slug,
      }
    : null

  return {
    org,
    isLoading,
    error,
    isForbidden: !!slug && !isLoading && !error && !org,
    canManage: canManageOrgDevelopers(membership?.role, teamRoles.data ?? []),
  }
}
