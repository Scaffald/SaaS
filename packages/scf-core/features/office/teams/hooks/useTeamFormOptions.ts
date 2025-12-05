import { api } from '@scf/core/utils/api'
import { teamRoleKeySchema } from '@scf/schemas'
import type { AppRouter } from '@scf/supabase/client-types'
import type { inferRouterOutputs } from '@trpc/server'
import { useMemo } from 'react'

type TeamRolesOutput = inferRouterOutputs<AppRouter>['teams']['members']['roles']
type RoleRecord = NonNullable<TeamRolesOutput['roles']>[number]

type TeamRoleKey = ReturnType<(typeof teamRoleKeySchema)['parse']>

export interface TeamRoleOption {
  id: string
  key: TeamRoleKey
  name: string
  description?: string | null
}

interface UseTeamFormOptionsParams {
  organizationId?: string
}

export function useTeamFormOptions({ organizationId }: UseTeamFormOptionsParams) {
  const rolesQuery = api.teams.members.roles.useQuery(
    { organizationId },
    {
      enabled: Boolean(organizationId),
    }
  )

  const roles: TeamRoleOption[] = useMemo(() => {
    return (
      rolesQuery.data?.roles?.map(
        (role: RoleRecord): TeamRoleOption => ({
          id: role.id,
          key: teamRoleKeySchema.parse(role.key),
          name: role.name,
          description: role.description ?? null,
        })
      ) ?? []
    )
  }, [rolesQuery.data])

  return {
    roles,
    isLoading: rolesQuery.isLoading,
    isFetching: rolesQuery.isFetching,
    refetchRoles: rolesQuery.refetch,
  }
}
