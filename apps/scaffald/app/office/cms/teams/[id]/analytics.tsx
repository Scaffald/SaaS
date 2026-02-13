import { ROUTES, RouteBuilder } from '@scf/core/constants/routes'
import {
  TeamActivityFeed,
  TeamAnalyticsCharts,
  TeamAnalyticsSummary,
} from '@scf/core/features/office/teams'
import { api } from '@scf/core/utils/api'
import type { AppRouter } from '@scf/supabase/client-types'
import { ArrowLeft, BarChart3 } from 'lucide-react-native'
import type { inferRouterOutputs } from '@trpc/server'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMemo } from 'react'
import { ScrollView } from 'react-native'
import { Button, Card, Spinner, Text, Row, Stack } from '@unicornlove/beyond-ui'

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
        onAction={() => router.replace(ROUTES.OFFICE.CMS.TEAMS.path)}
      />
    )
  }

  if (teamQuery.isLoading && !team) {
    return (
      <Stack align="center" justify="center" gap={12}>
        <Spinner size="lg" />
        <Text color="gray">Loading team analytics…</Text>
      </Stack>
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
      <Stack gap={20} padding={16} paddingBottom={32}>
        <Row justify="space-between" align="center" gap={12}>
          <Row gap={8} align="center">
            <Button
              size="md"
              variant="outline"
              iconStart={ArrowLeft}
              onPress={() => router.push(RouteBuilder.officeTeamsDetail(team.id))}
            >Back to team</Button>
            <Row gap={8} align="center">
              <BarChart3 size={20} />
              <Stack>
                <Text>
                  {team.name ?? 'Team analytics'}
                </Text>
                <Text color="gray">
                  Insights for collaboration, hiring throughput, and workload.
                </Text>
              </Stack>
            </Row>
          </Row>

          <Button
            size="md"
            variant="outline"
            onPress={() => router.push(RouteBuilder.officeTeamsSettings(team.id))}
          >Team settings</Button>
        </Row>

        <TeamAnalyticsSummary teamId={team.id} />

        <TeamAnalyticsCharts teamId={team.id} />

        <TeamActivityFeed
          teamId={team.id}
          mentionOptions={mentionOptions}
          memberDirectory={memberDirectory}
        />
      </Stack>
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
    <Stack align="center" justify="center">
      <Card
       
       
       
        padding={16}
        gap={12}
      >
        <Text>
          {title}
        </Text>
        <Text color="gray">{description}</Text>
        <Button onPress={onAction}>{actionLabel}</Button>
      </Card>
    </Stack>
  )
}
