import { type ReactNode, useMemo } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Button, Card, Separator, Spinner, Text, XStack, YStack } from 'tamagui'
import { AlertTriangle, ArrowLeft, CalendarClock, Users } from '@tamagui/lucide-icons'
import type { inferRouterOutputs } from '@trpc/server'
import type { AppRouter } from '@app/supabase/client-types'

import { DashboardLayout } from '@app/ui'
import { api } from '@app/core/utils/api'
import { ROUTES, RouteBuilder } from '@app/core/constants/routes'

type TeamDetailOutput = inferRouterOutputs<AppRouter>['teams']['byId']
type TeamRecord = TeamDetailOutput['team']
type TeamMembersOutput = inferRouterOutputs<AppRouter>['teams']['members']['list']
type TeamMemberRecord = NonNullable<TeamMembersOutput['members']>[number]

export default function DashboardTeamDetailPage() {
  const { id } = useLocalSearchParams<{ id?: string }>()
  const router = useRouter()

  const teamId = typeof id === 'string' ? id : ''

  const {
    data: teamData,
    isLoading: teamLoading,
    error: teamError,
    refetch: refetchTeam,
  } = api.teams.byId.useQuery(
    { teamId },
    {
      enabled: Boolean(teamId),
      retry: false,
    }
  )

  const {
    data: membersData,
    isLoading: membersLoading,
    error: membersError,
    refetch: refetchMembers,
  } = api.teams.members.list.useQuery(
    { teamId },
    {
      enabled: Boolean(teamId),
      retry: false,
    }
  )

  const team = teamData?.team as TeamRecord | undefined
  const members = useMemo<TeamMemberRecord[]>(
    () => (membersData?.members ?? []) as TeamMemberRecord[],
    [membersData?.members]
  )

  const breadcrumbItems = useMemo(
    () => [
      { label: 'Dashboard', href: ROUTES.DASHBOARD.path },
      { label: 'Teams', href: RouteBuilder.dashboardTeams() },
      { label: team?.name ?? 'Team', isActive: true },
    ],
    [team?.name]
  )

  if (!teamId) {
    return (
      <DashboardLayout
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
        autoGenerateBreadcrumbs={false}
      />
    )
  }

  const isLoading = teamLoading || membersLoading
  const hasError = teamError || membersError

  const handleRefresh = () => {
    void refetchTeam()
    void refetchMembers()
  }

  const mainContent = isLoading ? (
    <YStack items="center" justify="center" py="$6" gap="$2">
      <Spinner size="large" />
      <Text color="$color11">Loading team details…</Text>
    </YStack>
  ) : hasError ? (
    <ErrorCard
      title="Unable to load team"
      message={
        teamError?.message ??
        membersError?.message ??
        'An unexpected error occurred while loading this team.'
      }
      actionLabel="Retry"
      onAction={handleRefresh}
    />
  ) : team ? (
    <YStack gap="$4">
      <Card p="$4" borderWidth={1} borderColor="$borderColor" gap="$3">
        <XStack gap="$3" items="center">
          <Users size={22} />
          <Text fontSize="$7" fontWeight="700">
            {team.name || 'Untitled team'}
          </Text>
        </XStack>
        {team.description ? (
          <Text color="$color11">{team.description}</Text>
        ) : (
          <Text color="$color11">No description has been set for this team.</Text>
        )}
        <Separator />
        <XStack gap="$4" flexWrap="wrap">
          <InfoBadge label="Purpose" value={team.purpose ?? 'General'} />
          <InfoBadge
            label="Visibility"
            value={team.visibility === 'private' ? 'Private' : 'Organization'}
          />
          <InfoBadge
            label="Invitation policy"
            value={
              team.invitationPolicy === 'open'
                ? 'Open'
                : team.invitationPolicy === 'request'
                  ? 'Requests require approval'
                  : 'Invite only'
            }
          />
          {team.createdAt ? (
            <InfoBadge
              label="Created"
              value={new Date(team.createdAt).toLocaleDateString()}
              icon={<CalendarClock size={16} />}
            />
          ) : null}
        </XStack>
        <XStack>
          <Button
            size="$3"
            variant="outlined"
            icon={ArrowLeft}
            onPress={() => router.push(RouteBuilder.dashboardTeams())}
          >
            Back to teams
          </Button>
        </XStack>
      </Card>

      <Card p="$4" borderWidth={1} borderColor="$borderColor" gap="$3">
        <XStack justify="space-between" items="center">
          <Text fontSize="$6" fontWeight="700">
            Members
          </Text>
          <Button
            size="$3"
            variant="outlined"
            onPress={() => router.push(RouteBuilder.dashboardTeamsInvitations())}
          >
            View invitations
          </Button>
        </XStack>
        {members.length === 0 ? (
          <Text color="$color11">No members yet.</Text>
        ) : (
          <YStack gap="$2">
            {members.map((member) => {
              const displayName =
                member.user?.displayName ||
                member.user?.username ||
                (member.userId ? `User ${member.userId}` : 'Member')
              const roleName = member.role?.name ?? 'Member'
              return (
                <Card
                  key={member.id}
                  p="$3"
                  borderWidth={1}
                  borderColor="$borderColor"
                  bg="$color2"
                >
                  <Text fontWeight="600">{displayName}</Text>
                  <Text color="$color11">Role: {roleName}</Text>
                  <Text color="$color10" fontSize="$2">
                    Status: {member.status}
                  </Text>
                </Card>
              )
            })}
          </YStack>
        )}
      </Card>
    </YStack>
  ) : (
    <ErrorCard
      title="Team not found"
      message="We could not locate this team. It may have been archived or removed."
      actionLabel="Back to teams"
      onAction={() => router.replace(RouteBuilder.dashboardTeams())}
    />
  )

  return (
    <DashboardLayout
      leftContent={mainContent}
      showBreadcrumb
      breadcrumbItems={breadcrumbItems}
      autoGenerateBreadcrumbs={false}
    />
  )
}

function InfoBadge({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon?: ReactNode
}) {
  return (
    <XStack
      gap="$2"
      items="center"
      borderWidth={1}
      borderColor="$borderColor"
      rounded="$4"
      px="$3"
      py="$2"
      bg="$color3"
    >
      {icon ?? null}
      <YStack>
        <Text fontSize="$2" color="$color10" textTransform="uppercase">
          {label}
        </Text>
        <Text fontWeight="600">{value}</Text>
      </YStack>
    </XStack>
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
    <Card p="$4" borderWidth={1} borderColor="$borderColor" gap="$3" bg="$color2">
      <XStack gap="$2" items="center">
        <AlertTriangle size={20} color="$yellow10" />
        <Text fontSize="$6" fontWeight="700">
          {title}
        </Text>
      </XStack>
      <Text color="$color11">{message}</Text>
      <Button size="$3" onPress={onAction}>
        {actionLabel}
      </Button>
    </Card>
  )
}
