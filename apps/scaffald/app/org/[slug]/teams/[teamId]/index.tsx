import { RouteBuilder } from '@scf/core/constants/routes'
import { ROUTES } from '@scf/core/constants/routes'
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
import { useTeam, useTeamMembers, useTeamAnalyticsOverview } from '@scf/core/utils/teams-sdk-hooks'
import type { Team, TeamMember } from '@scaffald/sdk'
import { AlertTriangle, RefreshCw, UserPlus } from 'lucide-react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { Button, Card, Spinner, Text, Row, Stack } from '@scaffald/ui'

type TeamRecord = Team
type TeamMemberRecord = TeamMember

type MentionOption = { id: string; label: string }

export default function OrgTeamDetailPage() {
  const { slug, teamId: teamIdParam } = useLocalSearchParams<{ slug: string; teamId: string }>()
  const router = useRouter()
  const teamId = typeof teamIdParam === 'string' ? teamIdParam : ''
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [invitationRefreshKey, setInvitationRefreshKey] = useState(0)

  const { data: teamData, isLoading: teamLoading, error: teamError, refetch: refetchTeam } = useTeam(
    teamId || undefined,
    { enabled: Boolean(teamId) }
  )
  const { data: membersData, isLoading: membersLoading, error: membersError, refetch: refetchMembers } =
    useTeamMembers(teamId || undefined, { enabled: Boolean(teamId) })
  const { data: analyticsData, isLoading: analyticsLoading, error: analyticsError, refetch: refetchAnalytics } =
    useTeamAnalyticsOverview(teamId || undefined, { limit: 30 }, { enabled: Boolean(teamId) })

  const team = teamData?.team as TeamRecord | undefined
  const members = useMemo<TeamMemberRecord[]>(
    () => (membersData?.members ?? []) as TeamMemberRecord[],
    [membersData?.members]
  )
  const mentionOptions = useMemo<MentionOption[]>(() => {
    const map = new Map<string, MentionOption>()
    for (const member of members) {
      if (!member.userId) continue
      const label = member.user?.displayName ?? member.user?.username ?? `User ${member.userId.slice(0, 6)}`
      map.set(member.userId, { id: member.userId, label })
    }
    return Array.from(map.values())
  }, [members])
  const memberDirectory = useMemo(
    () =>
      members.reduce<Record<string, { displayName?: string | null; username?: string | null }>>((acc, member) => {
        if (member.userId) {
          acc[member.userId] = {
            displayName: member.user?.displayName ?? null,
            username: member.user?.username ?? null,
          }
        }
        return acc
      }, {}),
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

  const backHref = slug ? RouteBuilder.orgTeams(slug) : ROUTES.ORG.path
  const breadcrumbItems = useMemo(
    () => [
      { href: ROUTES.ORG.path, label: 'My Organizations' },
      { href: slug ? RouteBuilder.orgDetail(slug) : ROUTES.ORG.path, label: 'Organization' },
      { href: backHref, label: 'Teams' },
      { isActive: true, label: team?.name ?? 'Team' },
    ],
    [slug, backHref, team?.name]
  )

  if (!teamId || !slug) {
    return (
      <DashboardPage
        leftContent={
          <ErrorCard
            title="Missing parameters"
            message="This page requires organization and team in the URL."
            actionLabel="Back to My Organizations"
            onAction={() => router.replace(RouteBuilder.orgIndex())}
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
    teamError?.message ?? membersError?.message ?? analyticsError?.message ?? 'An unexpected error occurred.'

  const handleRefresh = () => {
    void refetchTeam()
    void refetchMembers()
    void refetchAnalytics()
  }

  const overviewActions = (
    <Row gap={8}>
      <Button size="md" variant="outline" iconStart={RefreshCw} onPress={handleRefresh} disabled={isLoading}>
        Refresh
      </Button>
      <Button size="md" color="primary" iconStart={UserPlus} onPress={() => setIsInviteModalOpen(true)}>
        Invite member
      </Button>
    </Row>
  )

  const mainContent = isLoading ? (
    <Stack align="center" justify="center" gap={8}>
      <Spinner size="lg" />
      <Text color="gray">Loading team details…</Text>
    </Stack>
  ) : hasError ? (
    <ErrorCard title="Unable to load team" message={errorMessage} actionLabel="Retry" onAction={handleRefresh} />
  ) : team ? (
    <Stack gap={16}>
      <TeamOverviewCard team={team} stats={overviewStats} actions={overviewActions} />
      <Card padding="md">
        <TeamAnalyticsSummary teamId={teamId} />
      </Card>
      <Card padding="md">
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
      <Card padding="md">
        <TeamActivityFeed
          teamId={teamId}
          mentionOptions={mentionOptions}
          memberDirectory={memberDirectory}
        />
      </Card>
      <Card padding="md">
        <TeamMembersList teamId={teamId} organizationId={team.organizationId} />
      </Card>
      <Card padding="md">
        <TeamInvitationsList
          teamId={teamId}
          refreshKey={invitationRefreshKey}
          headerAction={
            <Button size="md" color="primary" iconStart={UserPlus} onPress={() => setIsInviteModalOpen(true)}>
              Invite
            </Button>
          }
        />
      </Card>
    </Stack>
  ) : (
    <ErrorCard
      title="Team not found"
      message="We could not locate this team."
      actionLabel="Back to teams"
      onAction={() => (slug ? router.replace(RouteBuilder.orgTeams(slug)) : router.back())}
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
    <Card padding="md">
      <Stack gap={12}>
        <Row gap={8} align="center">
          <AlertTriangle size={20} color="$yellow10" />
          <Text>{title}</Text>
        </Row>
        <Text color="gray">{message}</Text>
        <Button size="md" onPress={onAction}>
          {actionLabel}
        </Button>
      </Stack>
    </Card>
  )
}
