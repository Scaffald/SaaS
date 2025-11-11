import { useMemo, useState } from 'react'
import { useRouter } from 'expo-router'
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'
import { XStack, Text, YStack, Spinner, Button } from 'tamagui'
import { useToastController } from '@tamagui/toast'
import { Pencil } from '@tamagui/lucide-icons'
import type { AppRouter } from '@app/supabase/client-types'
import type { inferRouterOutputs } from '@trpc/server'

import { ROUTES, RouteBuilder } from '@app/core/constants/routes'
import { api } from '@app/core/utils/api'
import { TEAM_VISIBILITIES, teamRoleKeySchema } from '@app/schemas'

import { OfficePageLayout } from '../components/OfficePageLayout'
import { DeleteButton } from '../components/DeleteButton'

type TeamVisibility = (typeof TEAM_VISIBILITIES)[number]
type TeamRoleKey = ReturnType<typeof teamRoleKeySchema['parse']>

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

const columnHelper = createColumnHelper<TeamRow>()

const createColumns = (
  router: ReturnType<typeof useRouter>,
  onArchive: (team: TeamRow) => Promise<void>,
): ColumnDef<TeamRow, unknown>[] =>
  [
    columnHelper.accessor('name', {
      header: 'Team Name',
      cell: (info) => info.getValue(),
      meta: {
        width: '$20',
      },
    }),
    columnHelper.accessor('visibility', {
      header: 'Visibility',
      cell: (info) => {
        const value = info.getValue()
        return value.charAt(0).toUpperCase() + value.slice(1)
      },
    }),
    columnHelper.accessor('defaultRoleName', {
      header: 'Default Role',
      cell: (info) => info.getValue() ?? info.row.original.defaultRoleKey ?? 'Member',
    }),
    columnHelper.accessor('updatedAt', {
      header: 'Updated',
      cell: (info) => {
        const value = info.getValue()
        return value ? new Date(value).toLocaleDateString() : '—'
      },
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: (info) => {
        const team = info.row.original
        return (
          <XStack gap="$2">
            <Button
              size="$2"
              variant="outlined"
              icon={Pencil}
              onPress={() => router.push(RouteBuilder.officeTeamsEdit(team.id))}
            >
              Edit
            </Button>
            <DeleteButton
              itemName={team.name}
              itemType="team"
              onDelete={() => onArchive(team)}
              size="$2"
            />
          </XStack>
        )
      },
    }),
  ] satisfies ColumnDef<TeamRow, unknown>[]

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
    onError: (error: Error) => {
      toast.show('Unable to archive team', {
        message: error.message ?? 'Please try again shortly.',
      })
    },
  })

  const teams: TeamRow[] = useMemo(() => {
    if (!data?.teams?.length) {
      return []
    }

    return (data.teams as TeamRecord[]).map((team) => {
      const parsedVisibility = TEAM_VISIBILITIES.includes(
        team.visibility as TeamVisibility,
      )
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
        (team.defaultRoleKey ?? '').toLowerCase().includes(query),
    )
  }, [teams, search])

  const archiveTeam = archiveMutation.mutateAsync

  const columns = useMemo(
    () =>
      createColumns(router, async (team) => {
        await archiveTeam({
          teamId: team.id,
          reason: 'Archived from office dashboard',
        })
      }),
    [router, archiveTeam],
  )

  return (
    <YStack flex={1}>
      <OfficePageLayout
        title="Teams"
        searchPlaceholder="Search teams..."
        searchValue={search}
        onSearchChange={setSearch}
        createButtonLabel="Create Team"
        onCreateClick={() => router.push(ROUTES.OFFICE_TEAMS_CREATE.path)}
        columns={columns}
        data={filteredTeams}
        isLoading={isLoading || archiveMutation.isPending}
        emptyMessage="No teams found"
      />
      {archiveMutation.isPending ? (
        <YStack
          alignSelf="flex-end"
          bg="$color2"
          p="$3"
          rounded="$4"
          shadowColor="$color10"
          style={{ marginRight: 16, marginBottom: 16 }}
        >
          <XStack gap="$3" items="center">
            <Spinner size="small" />
            <Text>Archiving team...</Text>
          </XStack>
        </YStack>
      ) : null}
    </YStack>
  )
}

