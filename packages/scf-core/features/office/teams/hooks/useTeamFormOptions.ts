import { useTeamRoles } from '@scaffald/sdk/react'
import { teamRoleKeySchema } from '@scf/schemas'
import type { TeamRole } from '@scaffald/sdk'
import { useMemo } from 'react'

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
  const rolesQuery = useTeamRoles(organizationId ?? '', {
    enabled: Boolean(organizationId),
  })

  const roles: TeamRoleOption[] = useMemo(() => {
    return (
      rolesQuery.data?.roles?.map(
        (role: TeamRole): TeamRoleOption => ({
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
