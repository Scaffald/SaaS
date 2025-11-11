import { useMemo } from 'react'
import { useToastController } from '@tamagui/toast'

import { api } from '@app/core/utils/api'

interface UseTeamFormOptionsParams {
  organizationId?: string
  currentTeamId?: string
}

interface TeamOption {
  id: string
  name: string
  isArchived?: boolean
}

interface RoleOption {
  id: string
  key: string
  name: string
  level?: number
  description?: string | null
  isDefault?: boolean
}

export function useTeamFormOptions({ organizationId, currentTeamId }: UseTeamFormOptionsParams) {
  const toast = useToastController()

  const rolesQuery = api.teams.members.roles.useQuery(undefined, {
    onError: (error) => {
      toast.show('Error', {
        message: error.message ?? 'Failed to load team roles',
      })
    },
  })

  const teamsQuery = api.teams.list.useQuery(
    { organizationId, includeArchived: false },
    {
      enabled: Boolean(organizationId),
      onError: (error) => {
        toast.show('Error', {
          message: error.message ?? 'Failed to load teams',
        })
      },
    },
  )

  const roles: RoleOption[] = useMemo(() => {
    return rolesQuery.data?.roles ?? []
  }, [rolesQuery.data])

  const parentTeamOptions: TeamOption[] = useMemo(() => {
    const teams = teamsQuery.data?.teams ?? []

    return teams
      .filter((team) => team.id !== currentTeamId)
      .map((team) => ({
        id: team.id as string,
        name: team.name as string,
        isArchived: team.isArchived as boolean | undefined,
      }))
  }, [teamsQuery.data?.teams, currentTeamId])

  return {
    roles,
    parentTeamOptions,
    isLoading: rolesQuery.isLoading || teamsQuery.isLoading,
    isFetching: rolesQuery.isFetching || teamsQuery.isFetching,
    refetchParentTeams: teamsQuery.refetch,
  }
}


