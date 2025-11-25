import { ROUTES, buildPath } from '@app/core/constants/routes'
import { api } from '@app/core/utils/api'
import { TEAM_VISIBILITIES, teamRoleKeySchema } from '@app/schemas'
import type { AppRouter } from '@app/supabase/client-types'
import { useToastController } from '@tamagui/toast'
import type { CellContext, ColumnDef } from '@tanstack/react-table'
import type { inferRouterOutputs } from '@trpc/server'
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { Spinner, Text, XStack, YStack } from 'tamagui'
import { OfficePageLayout } from '../components/OfficePageLayout'
import { QuickActionsWidget } from '../components/QuickActionsWidget'

type TeamVisibility = (typeof TEAM_VISIBILITIES)[number]
type TeamRoleKey = ReturnType<(typeof teamRoleKeySchema)['parse']>

type TeamsListOutput = inferRouterOutputs<AppRouter>['teams']['list']
type TeamRecord = NonNullable<TeamsListOutput['teams']>[number]

type TeamRow = {
  id: string
  name: string
  visibility: TeamVisibility
  defaultRoleName?: string | null
  defaultRoleKey?: TeamRoleKey | null
  updatedAt?: string
}

const createColumns = (_router: ReturnType<typeof useRouter>): ColumnDef<TeamRow, unknown>[] => [
  {
    accessorKey: 'name',
    header: 'Team Name',
    cell: ({ row }: CellContext<TeamRow, unknown>) => row.original.name,
    meta: {
      width: '$20',
    },
  },
  {
    accessorKey: 'visibility',
    header: 'Visibility',
    cell: ({ row }: CellContext<TeamRow, unknown>) => {
      const value = row.original.visibility
      return value.charAt(0).toUpperCase() + value.slice(1)
    },
  },
  {
    accessorKey: 'defaultRoleName',
    header: 'Default Role',
    cell: ({ row }: CellContext<TeamRow, unknown>) =>
      row.original.defaultRoleName ?? row.original.defaultRoleKey ?? 'Member',
  },
  {
    accessorKey: 'updatedAt',
    header: 'Updated',
    cell: ({ row }: CellContext<TeamRow, unknown>) => {
      const value = row.original.updatedAt
      return value ? new Date(value).toLocaleDateString() : '—'
    },
  },
  // Actions column removed - using RowActionOverlay instead
]

export function OfficeTeamsList() {
  const router = useRouter()
  const toast = useToastController()
  const [search, setSearch] = useState('')

  const { data, isLoading, refetch } = api.teams.list.useQuery({
    includeArchived: false,
  })

  const archiveMutation = api.teams.archive.useMutation({
    onSuccess: () => {
      toast.show('Team archived', { message: 'The team is no longer visible to members.' })
      void refetch()
    },
    onError: (error: any) => {
      toast.show('Unable to archive team', {
        message: error?.message ?? 'Please try again shortly.',
      })
    },
  })

  const teams: TeamRow[] = useMemo(() => {
    if (!data?.teams?.length) {
      return []
    }

    return (data.teams as TeamRecord[]).map((team) => {
      const parsedVisibility = TEAM_VISIBILITIES.includes(team.visibility as TeamVisibility)
        ? (team.visibility as TeamVisibility)
        : 'organization'

      return {
        id: team.id,
        name: team.name ?? 'Untitled Team',
        visibility: parsedVisibility,
        defaultRoleName: team.defaultRole?.name ?? null,
        defaultRoleKey: team.defaultRole?.key
          ? teamRoleKeySchema.parse(team.defaultRole.key)
          : null,
        updatedAt: team.updatedAt ?? undefined,
      }
    })
  }, [data?.teams])

  const filteredTeams = useMemo(() => {
    if (!search.trim()) {
      return teams
    }

    const query = search.toLowerCase()
    return teams.filter(
      (team) =>
        team.name.toLowerCase().includes(query) ||
        (team.defaultRoleName ?? '').toLowerCase().includes(query) ||
        (team.defaultRoleKey ?? '').toLowerCase().includes(query)
    )
  }, [teams, search])

  const archiveTeam = archiveMutation.mutateAsync

  const columns = useMemo(() => createColumns(router), [router])

  const handleRowEdit = (team: TeamRow) => {
    router.push(buildPath(ROUTES.OFFICE.CMS.TEAMS.DETAIL.EDIT, { id: team.id }))
  }

  const handleRowDelete = async (team: TeamRow) => {
    await archiveTeam({
      teamId: team.id,
      reason: 'Archived from office dashboard',
    })
  }

  const getItemName = (team: TeamRow) => team.name

  return (
    <OfficePageLayout
      wrapWithOfficeLayout
      showBreadcrumb
      title="Teams"
      searchPlaceholder="Search teams..."
      searchValue={search}
      onSearchChange={setSearch}
      createButtonLabel="Create Team"
      onCreateClick={() => router.push(ROUTES.OFFICE.CMS.TEAMS.CREATE.path)}
      columns={columns}
      data={filteredTeams}
      isLoading={isLoading || archiveMutation.isPending}
      emptyMessage="No teams found"
      onRowEdit={handleRowEdit}
      onRowDelete={handleRowDelete}
      getItemName={getItemName}
      itemType="team"
      rightContent={
        <QuickActionsWidget
          context="list"
          resourceName="Team"
          onCreate={() => router.push(ROUTES.OFFICE.CMS.TEAMS.CREATE.path)}
          onRefresh={() => refetch()}
          isLoading={isLoading || archiveMutation.isPending}
        />
      }
      afterContent={
        archiveMutation.isPending ? (
          <YStack
            bg="$color2"
            p="$3"
            rounded="$4"
            shadowColor="$color10"
            alignSelf="flex-end"
            mr="$4"
            mb="$4"
          >
            <XStack gap="$3" items="center">
              <Spinner size="small" />
              <Text>Archiving team...</Text>
            </XStack>
          </YStack>
        ) : null
      }
    />
  )
}
