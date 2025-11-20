import { ROUTES, RouteBuilder } from '@app/core/constants/routes'
import { api } from '@app/core/utils/api'
import type { AppRouter } from '@app/supabase/client-types'
import { DashboardLayout, QuickLinksSidebar } from '@app/ui'
import { Users } from '@tamagui/lucide-icons'
import type { inferRouterOutputs } from '@trpc/server'
import { useRouter } from 'expo-router'
import { useMemo } from 'react'
import { Button, Card, Spinner, Text, XStack, YStack } from 'tamagui'

type TeamsListOutput = inferRouterOutputs<AppRouter>['teams']['list']
type TeamRecord = NonNullable<TeamsListOutput['teams']>[number]

export default function DashboardTeamsIndexPage() {
  const router = useRouter()
  const { data, isLoading, error, refetch, isRefetching } = api.teams.list.useQuery({
    includeArchived: false,
  })

  const teams = useMemo<TeamRecord[]>(() => (data?.teams ?? []) as TeamRecord[], [data?.teams])

  const breadcrumbItems = useMemo(
    () => [
      { label: 'Dashboard', href: ROUTES.DASHBOARD.path },
      { label: 'Teams', isActive: true },
    ],
    []
  )

  const mainContent = (
    <YStack gap="$4">
      <XStack justify="space-between" items="center">
        <YStack gap="$1">
          <Text fontSize="$7" fontWeight="700">
            Teams
          </Text>
          <Text color="$color11">
            View the teams you collaborate with and access shared hiring workspaces.
          </Text>
        </YStack>
        <Button
          variant="outlined"
          size="$3"
          onPress={() => router.push(RouteBuilder.dashboardTeamsInvitations())}
        >
          Manage invitations
        </Button>
      </XStack>

      {isLoading || isRefetching ? (
        <YStack items="center" justify="center" py="$6" gap="$2">
          <Spinner size="large" />
          <Text color="$color11">Loading your teams…</Text>
        </YStack>
      ) : error ? (
        <YStack gap="$3" borderWidth={1} borderColor="$red8" rounded="$4" p="$4" bg="$red2">
          <Text fontWeight="600" color="$red11">
            Unable to load teams
          </Text>
          <Text color="$red10">
            {error.message ?? 'An unexpected error occurred while loading your teams.'}
          </Text>
          <Button size="$3" onPress={() => refetch()}>
            Try again
          </Button>
        </YStack>
      ) : teams.length === 0 ? (
        <YStack
          gap="$3"
          borderWidth={1}
          borderColor="$borderColor"
          rounded="$4"
          p="$4"
          bg="$color2"
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
        </YStack>
      ) : (
        <YStack gap="$3">
          {teams.map((team) => {
            const formattedPurpose = team.purpose
              ? team.purpose.replace(/^\w/, (char: string) => char.toUpperCase())
              : 'General'

            return (
              <Card key={team.id} p="$4" borderWidth={1} borderColor="$borderColor" gap="$3">
                <XStack gap="$3" items="center">
                  <Users size={20} />
                  <Text fontSize="$5" fontWeight="700">
                    {team.name || 'Untitled team'}
                  </Text>
                </XStack>
                {team.description ? (
                  <Text color="$color11">{team.description}</Text>
                ) : (
                  <Text color="$color11">No description provided for this team.</Text>
                )}
                <XStack gap="$3" items="center">
                  <Text color="$color10" fontSize="$3">
                    {formattedPurpose}
                  </Text>
                  <Text color="$color10" fontSize="$3">
                    Visibility: {team.visibility === 'private' ? 'Private' : 'Organization'}
                  </Text>
                </XStack>
                <XStack gap="$2">
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
                </XStack>
              </Card>
            )
          })}
        </YStack>
      )}
    </YStack>
  )

  return (
    <DashboardLayout
      leftContent={mainContent}
      showBreadcrumb
      breadcrumbItems={breadcrumbItems}
      autoGenerateBreadcrumbs={false}
      rightContent={<QuickLinksSidebar />}
    />
  )
}
