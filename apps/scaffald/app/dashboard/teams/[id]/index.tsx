import { ROUTES, RouteBuilder } from '@scf/core/constants/routes'
import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import {
  TeamActivityFeed,
  TeamAnalyticsSummary,
  TeamAutomationSettings,
  TeamInvitationsList,
  TeamInviteModal,
  TeamMembersList,
  TeamOverviewCard,
} from '@scf/core/features/office/teams'
import { api } from '@scf/core/utils/api'
import type { AppRouter } from '@scf/supabase/client-types'
import { AlertTriangle, RefreshCw, UserPlus } from 'lucide-react-native'
import type { inferRouterOutputs } from '@trpc/server'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { Button, Card, Spinner, Text, Row, Stack } from '@unicornlove/beyond-ui'

type TeamDetailOutput = inferRouterOutputs<AppRouter>['teams']['byId']
type TeamRecord = TeamDetailOutput['team']
type TeamMembersOutput = inferRouterOutputs<AppRouter>['teams']['members']['list']
type TeamMemberRecord = NonNullable<TeamMembersOutput['members']>[number]

type MentionOption = {
  id: string
  label: string
}

export default function DashboardTeamDetailPage() {
  const { id } = useLocalSearchParams<{ id?: string }>()
  const router = useRouter()

  const teamId = typeof id === 'string' ? id : ''
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [invitationRefreshKey, setInvitationRefreshKey] = useState(0)

  const {
    data: teamData,
    isLoading: teamLoading,
    error: teamError,
    refetch: refetchTeam,
  } = api.teams.byId.useQuery({ teamId }, { enabled: Boolean(teamId), retry: false })

  const {
    data: membersData,
    isLoading: membersLoading,
    error: membersError,
    refetch: refetchMembers,
  } = api.teams.members.list.useQuery({ teamId }, { enabled: Boolean(teamId), retry: false })

  const {
    data: analyticsData,
    isLoading: analyticsLoading,
    error: analyticsError,
    refetch: refetchAnalytics,
  } = api.teams.analytics.overview.useQuery(
    { limit: 30, teamId },
    { enabled: Boolean(teamId), retry: false }
  )

  const team = teamData?.team as TeamRecord | undefined
  const members = useMemo<TeamMemberRecord[]>(
    () => (membersData?.members ?? []) as TeamMemberRecord[],
    [membersData?.members]
  )

  const mentionOptions = useMemo<MentionOption[]>(() => {
    const map = new Map<string, MentionOption>()
    for (const member of members) {
      if (!member.userId) continue
      const label =
        member.user?.displayName ?? member.user?.username ?? `User ${member.userId.slice(0, 6)}`
      map.set(member.userId, { id: member.userId, label })
    }
    return Array.from(map.values())
  }, [members])

  const memberDirectory = useMemo(
    () =>
      members.reduce<Record<string, { displayName?: string | null; username?: string | null }>>(
        (acc, member) => {
          if (member.userId) {
            acc[member.userId] = {
              displayName: member.user?.displayName ?? null,
              username: member.user?.username ?? null,
            }
          }
          return acc
        },
        {}
      ),
    [members]
  )

  const latestMetrics = analyticsData?.metrics?.[0] ?? null
  const memberCount = members.length

  const overviewStats = useMemo(
    () => ({
      jobCount: latestMetrics?.jobs?.active ?? undefined,
      memberCount: latestMetrics?.members?.active ?? (memberCount > 0 ? memberCount : undefined),
      pendingInvitations: latestMetrics?.invitations?.pending ?? undefined,
    }),
    [latestMetrics, memberCount]
  )

  const breadcrumbItems = useMemo(
    () => [
      { href: ROUTES.DASHBOARD.path, label: 'Dashboard' },
      { href: RouteBuilder.dashboardTeams(), label: 'Teams' },
      { isActive: true, label: team?.name ?? 'Team' },
    ],
    [team?.name]
  )

  if (!teamId) {
    return (
      <DashboardPage
        leftContent={
          <ErrorCard
            title="Missing team identifier"
            message="This page requires a team identifier in the URL."
            actionLabel="Back to teams"
            onAction={() => router.replace(RouteBuilder.dashboardTeams())}
          />
        }
        showBreadcrumb
        breadcrumbItems={breadcrumbItems}
        rightContent={null}
      />
    )
  }

  const isLoading = teamLoading || membersLoading || analyticsLoading
  const hasError = Boolean(teamError || membersError || analyticsError)
  const errorMessage =
    teamError?.message ??
    membersError?.message ??
    analyticsError?.message ??
    'An unexpected error occurred while loading this team.'

  const handleRefresh = () => {
    void refetchTeam()
    void refetchMembers()
    void refetchAnalytics()
  }

  const overviewActions = (
    <Row gap="$2" flexWrap="wrap">
      <Button
        size="$2"
        variant="outlined"
        icon={RefreshCw}
        onPress={handleRefresh}
        disabled={isLoading}
      >
        Refresh
      </Button>
      <Button
        size="$2"
        backgroundColor="$color9"
        color="$color1"
        icon={UserPlus}
        onPress={() => setIsInviteModalOpen(true)}
      >
        Invite member
      </Button>
    </Row>
  )

  const mainContent = isLoading ? (
    <Stack alignItems="center" justifyContent="center" paddingVertical="$6" gap="$2">
      <Spinner size="large" />
      <Text color="$color11">Loading team details…</Text>
    </Stack>
  ) : hasError ? (
    <ErrorCard
      title="Unable to load team"
      message={errorMessage}
      actionLabel="Retry"
      onAction={handleRefresh}
    />
  ) : team ? (
    <Stack gap="$4">
      <TeamOverviewCard team={team} stats={overviewStats} actions={overviewActions} />

      <Card
        padding="$4"
        borderWidth={1}
        borderColor="$borderColor"
        backgroundColor="$color1"
        gap="$4"
      >
        <TeamAnalyticsSummary teamId={teamId} />
      </Card>

      <Card
        padding="$4"
        borderWidth={1}
        borderColor="$borderColor"
        backgroundColor="$color1"
        gap="$4"
      >
        <TeamAutomationSettings
          teamId={teamId}
          allowSelfJoin={team.allowSelfJoin ?? false}
          autoAssignJobs={team.autoAssignJobs ?? false}
          invitationExpirationDays={team.invitationExpirationDays ?? 7}
          workloadStrategy={team.workloadStrategy ?? 'manual'}
          workloadSettings={team.workloadSettings ?? {}}
          analyticsRefreshIntervalMinutes={team.analyticsRefreshIntervalMinutes ?? 60}
        />
      </Card>

      <Card
        padding="$4"
        borderWidth={1}
        borderColor="$borderColor"
        backgroundColor="$color1"
        gap="$4"
      >
        <TeamActivityFeed
          teamId={teamId}
          mentionOptions={mentionOptions}
          memberDirectory={memberDirectory}
        />
      </Card>

      <Card
        padding="$4"
        borderWidth={1}
        borderColor="$borderColor"
        backgroundColor="$color1"
        gap="$4"
      >
        <TeamMembersList teamId={teamId} organizationId={team.organizationId} />
      </Card>

      <Card
        padding="$4"
        borderWidth={1}
        borderColor="$borderColor"
        backgroundColor="$color1"
        gap="$4"
      >
        <TeamInvitationsList
          teamId={teamId}
          refreshKey={invitationRefreshKey}
          headerAction={
            <Button
              size="$2"
              backgroundColor="$color9"
              color="$color1"
              icon={UserPlus}
              onPress={() => setIsInviteModalOpen(true)}
            >
              Invite
            </Button>
          }
        />
      </Card>
    </Stack>
  ) : (
    <ErrorCard
      title="Team not found"
      message="We could not locate this team. It may have been archived or removed."
      actionLabel="Back to teams"
      onAction={() => router.replace(RouteBuilder.dashboardTeams())}
    />
  )

  return (
    <>
      <DashboardPage
        leftContent={mainContent}
        showBreadcrumb
        breadcrumbItems={breadcrumbItems}
        rightContent={null}
      />
      {team ? (
        <TeamInviteModal
          open={isInviteModalOpen}
          onOpenChange={setIsInviteModalOpen}
          teamId={teamId}
          organizationId={team.organizationId}
          defaultRoleId={team.defaultRoleId ?? undefined}
          onInvited={() => {
            setInvitationRefreshKey((prev) => prev + 1)
            handleRefresh()
          }}
        />
      ) : null}
    </>
  )
}

function ErrorCard({
  title,
  message,
  actionLabel,
  onAction,
}: {
  title: string
  message: string
  actionLabel: string
  onAction: () => void
}) {
  return (
    <Card
      padding="$4"
      borderWidth={1}
      borderColor="$borderColor"
      gap="$3"
      backgroundColor="$color2"
    >
      <Row gap="$2" alignItems="center">
        <AlertTriangle size={20} color="$yellow10" />
        <Text fontSize="$6" fontWeight="700">
          {title}
        </Text>
      </Row>
      <Text color="$color11">{message}</Text>
      <Button size="$3" onPress={onAction}>
        {actionLabel}
      </Button>
    </Card>
  )
}
