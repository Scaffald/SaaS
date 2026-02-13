import { RouteBuilder } from '@scf/core/constants/routes'
import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { Users } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { useMemo } from 'react'
import { Button, Card, Spinner, Text, Row, Stack } from '@unicornlove/beyond-ui'
import { useTeams } from '@scaffald/sdk/react'
import type { Team } from '@scaffald/sdk'

export default function DashboardTeamsIndexPage() {
  const router = useRouter()
  const { data, isLoading, error, refetch, isRefetching } = useTeams({
    includeArchived: false,
  })

  const teams = useMemo<Team[]>(() => data?.teams ?? [], [data?.teams])

  const mainContent = (
    <Stack gap={16}>
      <Row justify="space-between" align="center">
        <Stack gap={4}>
          <Text>Teams</Text>
          <Text color="gray">
            View the teams you collaborate with and access shared hiring workspaces.
          </Text>
        </Stack>
        <Button
          variant="outline"
          size="md"
          onPress={() => router.push(RouteBuilder.dashboardTeamsInvitations())}
        >
          Manage invitations
        </Button>
      </Row>

      {isLoading || isRefetching ? (
        <Stack align="center" justify="center" gap={8}>
          <Spinner size="lg" />
          <Text color="gray">Loading your teams…</Text>
        </Stack>
      ) : error ? (
        <Stack gap={12} padding={16}>
          <Text color="red">Unable to load teams</Text>
          <Text color="red">
            {error.message ?? 'An unexpected error occurred while loading your teams.'}
          </Text>
          <Button size="md" onPress={() => refetch()}>
            Try again
          </Button>
        </Stack>
      ) : teams.length === 0 ? (
        <Stack gap={12} padding={16}>
          <Text>No teams yet</Text>
          <Text color="gray">
            You&apos;re not part of any teams yet. Accept invitations from your inbox or reach out
            to an administrator to be added.
          </Text>
          <Button
            size="md"
            variant="outline"
            onPress={() => router.push(RouteBuilder.dashboardTeamsInvitations())}
          >
            View invitations
          </Button>
        </Stack>
      ) : (
        <Stack gap={12}>
          {teams.map((team) => {
            const formattedPurpose = team.purpose
              ? team.purpose.replace(/^\w/, (char: string) => char.toUpperCase())
              : 'General'

            return (
              <Card key={team.id} padding="md">
                <Stack gap={12}>
                  <Row gap={12} align="center">
                    <Users size={20} />
                    <Text>{team.name || 'Untitled team'}</Text>
                  </Row>
                  {team.description ? (
                    <Text color="gray">{team.description}</Text>
                  ) : (
                    <Text color="gray">No description provided for this team.</Text>
                  )}
                  <Row gap={12} align="center">
                    <Text color="gray">{formattedPurpose}</Text>
                    <Text color="gray">
                      Visibility: {team.visibility === 'private' ? 'Private' : 'Organization'}
                    </Text>
                  </Row>
                  <Row gap={8}>
                    <Button
                      size="md"
                      onPress={() => router.push(RouteBuilder.dashboardTeamDetail(team.id))}
                    >
                      Open team
                    </Button>
                    <Button
                      size="md"
                      variant="outline"
                      onPress={() => router.push(RouteBuilder.dashboardTeamsInvitations())}
                    >
                      View invitations
                    </Button>
                  </Row>
                </Stack>
              </Card>
            )
          })}
        </Stack>
      )}
    </Stack>
  )

  return <DashboardPage leftContent={mainContent} showBreadcrumb={false} rightContent={null} />
}
