import { useMemo } from 'react'
import { useToastController } from '@tamagui/toast'
import type { AppRouter } from '@app/supabase/client-types'
import type { inferRouterOutputs } from '@trpc/server'

import { api } from '@app/core/utils/api'
import { teamRoleKeySchema } from '@app/schemas'

type TeamRolesOutput = inferRouterOutputs<AppRouter>['teams']['members']['roles']
type RoleRecord = NonNullable<TeamRolesOutput['roles']>[number]

type TeamRoleKey = ReturnType<typeof teamRoleKeySchema['parse']>

interface RoleOption {
  id: string
  key: TeamRoleKey
  name: string
  description?: string | null
}

interface UseTeamFormOptionsParams {
  organizationId?: string
}

export function useTeamFormOptions({ organizationId }: UseTeamFormOptionsParams) {
  const toast = useToastController()

  const rolesQuery = api.teams.members.roles.useQuery(
    { organizationId },
    {
      enabled: Boolean(organizationId),
      onError: (error: Error) => {
        toast.show('Error', {
          message: error.message ?? 'Failed to load team roles',
        })
      },
    },
  )

  const roles: RoleOption[] = useMemo(() => {
    return (
      rolesQuery.data?.roles?.map((role: RoleRecord): RoleOption => ({
        id: role.id,
        key: teamRoleKeySchema.parse(role.key),
        name: role.name,
        description: role.description ?? null,
      })) ?? []
    )
  }, [rolesQuery.data])

  return {
    roles,
    isLoading: rolesQuery.isLoading,
    isFetching: rolesQuery.isFetching,
    refetchRoles: rolesQuery.refetch,
  }
}

