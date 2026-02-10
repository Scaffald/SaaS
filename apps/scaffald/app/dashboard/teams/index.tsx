import { RouteBuilder } from '@scf/core/constants/routes'
import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { api } from '@scf/core/utils/api'
import type { AppRouter } from '@scf/supabase/client-types'
import { Users } from '@tamagui/lucide-icons'
import type { inferRouterOutputs } from '@trpc/server'
import { useRouter } from 'expo-router'
import { useMemo } from 'react'
import { Button, Card, Spinner, Text, Row, Stack } from '@unicornlove/beyond-ui'

type TeamsListOutput = inferRouterOutputs<AppRouter>['teams']['list']
type TeamRecord = NonNullable<TeamsListOutput['teams']>[number]

export default function DashboardTeamsIndexPage() {
  const router = useRouter()
  const { data, isLoading, error, refetch, isRefetching } = api.teams.list.useQuery({
    includeArchived: false,
  })

  const teams = useMemo<TeamRecord[]>(() => (data?.teams ?? []) as TeamRecord[], [data?.teams])

  const mainContent = (
    <Stack gap="$4">
      <Row justifyContent="space-between" alignItems="center">
        <Stack gap="$1">
          <Text fontSize="$7" fontWeight="700">
            Teams
          </Text>
          <Text color="$color11">
            View the teams you collaborate with and access shared hiring workspaces.
          </Text>
        </Stack>
        <Button
          variant="outlined"
          size="$3"
          onPress={() => router.push(RouteBuilder.dashboardTeamsInvitations())}
        >
          Manage invitations
        </Button>
      </Row>

      {isLoading || isRefetching ? (
        <Stack alignItems="center" justifyContent="center" paddingVertical="$6" gap="$2">
          <Spinner size="large" />
          <Text color="$color11">Loading your teams…</Text>
        </Stack>
      ) : error ? (
        <Stack
          gap="$3"
          borderWidth={1}
          borderColor="$red8"
          borderRadius="$4"
          padding="$4"
          backgroundColor="$red2"
        >
          <Text fontWeight="600" color="$red11">
            Unable to load teams
          </Text>
          <Text color="$red10">
            {error.message ?? 'An unexpected error occurred while loading your teams.'}
          </Text>
          <Button size="$3" onPress={() => refetch()}>
            Try again
          </Button>
        </Stack>
      ) : teams.length === 0 ? (
        <Stack
          gap="$3"
          borderWidth={1}
          borderColor="$borderColor"
          borderRadius="$4"
          padding="$4"
          backgroundColor="$color2"
        >
          <Text fontWeight="600">No teams yet</Text>
          <Text color="$color11">
            You&apos;re not part of any teams yet. Accept invitations from your inbox or reach out
            to an administrator to be added.
          </Text>
          <Button
            size="$3"
            variant="outlined"
            onPress={() => router.push(RouteBuilder.dashboardTeamsInvitations())}
          >
            View invitations
          </Button>
        </Stack>
      ) : (
        <Stack gap="$3">
          {teams.map((team) => {
            const formattedPurpose = team.purpose
              ? team.purpose.replace(/^\w/, (char: string) => char.toUpperCase())
              : 'General'

            return (
              <Card key={team.id} padding="$4" borderWidth={1} borderColor="$borderColor" gap="$3">
                <Row gap="$3" alignItems="center">
                  <Users size={20} />
                  <Text fontSize="$5" fontWeight="700">
                    {team.name || 'Untitled team'}
                  </Text>
                </Row>
                {team.description ? (
                  <Text color="$color11">{team.description}</Text>
                ) : (
                  <Text color="$color11">No description provided for this team.</Text>
                )}
                <Row gap="$3" alignItems="center">
                  <Text color="$color10" fontSize="$3">
                    {formattedPurpose}
                  </Text>
                  <Text color="$color10" fontSize="$3">
                    Visibility: {team.visibility === 'private' ? 'Private' : 'Organization'}
                  </Text>
                </Row>
                <Row gap="$2">
                  <Button
                    size="$3"
                    onPress={() => router.push(RouteBuilder.dashboardTeamDetail(team.id))}
                  >
                    Open team
                  </Button>
                  <Button
                    size="$3"
                    variant="outlined"
                    onPress={() => router.push(RouteBuilder.dashboardTeamsInvitations())}
                  >
                    View invitations
                  </Button>
                </Row>
              </Card>
            )
          })}
        </Stack>
      )}
    </Stack>
  )

  return <DashboardPage leftContent={mainContent} showBreadcrumb={false} rightContent={null} />
}
