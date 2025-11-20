import { ROUTES, RouteBuilder } from '@app/core/constants/routes'
import {
  TeamActivityFeed,
  TeamAnalyticsCharts,
  TeamAnalyticsSummary,
} from '@app/core/features/office/teams'
import { api } from '@app/core/utils/api'
import type { AppRouter } from '@app/supabase/client-types'
import { ArrowLeft, BarChart3 } from '@tamagui/lucide-icons'
import type { inferRouterOutputs } from '@trpc/server'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMemo } from 'react'
import { ScrollView } from 'react-native'
import { Button, Card, Spinner, Text, XStack, YStack } from 'tamagui'

type MembersListOutput = inferRouterOutputs<AppRouter>['teams']['members']['list']
type MemberRecord = NonNullable<MembersListOutput['members']>[number]

export default function TeamAnalyticsPage() {
  const { id } = useLocalSearchParams<{ id?: string }>()
  const router = useRouter()

  const teamId = typeof id === 'string' ? id : ''

  const teamQuery = api.teams.byId.useQuery(
    { teamId },
    {
      enabled: Boolean(teamId),
    }
  )

  const membersQuery = api.teams.members.list.useQuery(
    { teamId },
    {
      enabled: Boolean(teamId),
      staleTime: 60_000,
    }
  )

  const team = teamQuery.data?.team ?? null

  const mentionOptions = useMemo((): Array<{ id: string; label: string }> => {
    if (!membersQuery.data?.members) return []
    return (membersQuery.data.members as MemberRecord[])
      .map((member: MemberRecord) => ({
        id: member.user?.id ?? '',
        label:
          member.user?.displayName ??
          member.user?.username ??
          `User ${member.user?.id?.slice(0, 6) ?? ''}`,
      }))
      .filter((option) => option.id)
  }, [membersQuery.data?.members])

  const memberDirectory = useMemo(() => {
    if (!membersQuery.data?.members) return {}

    const directory: Record<string, { displayName?: string | null; username?: string | null }> = {}

    for (const member of membersQuery.data.members as MemberRecord[]) {
      if (!member.user?.id) continue
      directory[member.user.id] = {
        displayName: member.user.displayName ?? null,
        username: member.user.username ?? null,
      }
    }

    return directory
  }, [membersQuery.data?.members])

  if (!teamId) {
    return (
      <FallbackCard
        title="Team not specified"
        description="Provide a team ID to view analytics."
        actionLabel="Return to teams"
        onAction={() => router.replace(ROUTES.OFFICE_CMS_TEAMS.path)}
      />
    )
  }

  if (teamQuery.isLoading && !team) {
    return (
      <YStack flex={1} items="center" justify="center" gap="$3">
        <Spinner size="large" />
        <Text color="$color11">Loading team analytics…</Text>
      </YStack>
    )
  }

  if (!team) {
    const message =
      teamQuery.error instanceof Error
        ? teamQuery.error.message
        : 'We could not load this team. Please try again.'
    return (
      <FallbackCard
        title="Team unavailable"
        description={message}
        actionLabel="Retry"
        onAction={() => void teamQuery.refetch()}
      />
    )
  }

  return (
    <ScrollView>
      <YStack gap="$5" p="$4" pb="$8">
        <XStack justify="space-between" items="center" flexWrap="wrap" gap="$3">
          <XStack gap="$2" items="center">
            <Button
              size="$2"
              variant="outlined"
              icon={ArrowLeft}
              onPress={() => router.push(RouteBuilder.officeTeamsDetail(team.id))}
            >
              Back to team
            </Button>
            <XStack gap="$2" items="center">
              <BarChart3 size={20} />
              <YStack>
                <Text fontSize="$6" fontWeight="700">
                  {team.name ?? 'Team analytics'}
                </Text>
                <Text fontSize="$3" color="$color10">
                  Insights for collaboration, hiring throughput, and workload.
                </Text>
              </YStack>
            </XStack>
          </XStack>

          <Button
            size="$2"
            variant="outlined"
            onPress={() => router.push(RouteBuilder.officeTeamsSettings(team.id))}
          >
            Team settings
          </Button>
        </XStack>

        <TeamAnalyticsSummary teamId={team.id} />

        <TeamAnalyticsCharts teamId={team.id} />

        <TeamActivityFeed
          teamId={team.id}
          mentionOptions={mentionOptions}
          memberDirectory={memberDirectory}
        />
      </YStack>
    </ScrollView>
  )
}

function FallbackCard({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string
  description: string
  actionLabel: string
  onAction: () => void
}) {
  return (
    <YStack flex={1} items="center" justify="center" px="$4">
      <Card borderWidth={1} borderColor="$borderColor" bg="$color2" p="$4" gap="$3">
        <Text fontSize="$6" fontWeight="700">
          {title}
        </Text>
        <Text color="$color11">{description}</Text>
        <Button onPress={onAction}>{actionLabel}</Button>
      </Card>
    </YStack>
  )
}
