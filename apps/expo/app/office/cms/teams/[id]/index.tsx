import { ROUTES, RouteBuilder } from '@app/core/constants/routes'
import {
  TeamInvitationsList,
  TeamInviteModal,
  TeamJobsList,
  TeamMembersList,
  TeamOverviewCard,
} from '@app/core/features/office/teams'
import { api } from '@app/core/utils/api'
import { useUserRoles } from '@app/core/utils/auth/useUserRoles'
import type { AppRouter } from '@app/supabase/client-types'
import {
  ArrowLeft,
  BarChart3,
  Briefcase,
  Pencil,
  RefreshCcw,
  UserPlus,
} from '@tamagui/lucide-icons'
import type { inferRouterOutputs } from '@trpc/server'
import { useLocalSearchParams, useRouter } from 'expo-router'
import type { ComponentType } from 'react'
import { useMemo, useState } from 'react'
import { Button, Card, ScrollView, Spinner, Text, XStack, YStack } from 'tamagui'

type TeamDetailOutput = inferRouterOutputs<AppRouter>['teams']['byId']
type TeamRecord = TeamDetailOutput['team']
type TeamMembersOutput = inferRouterOutputs<AppRouter>['teams']['members']['list']
type TeamInvitationOutput = inferRouterOutputs<AppRouter>['teams']['invitations']['list']
type OfficeJobsOutput = inferRouterOutputs<AppRouter>['office']['listJobs']
type TeamJobRecord = NonNullable<OfficeJobsOutput['jobs']>[number]

export default function OfficeTeamDetailPage() {
  const { id } = useLocalSearchParams<{ id?: string }>()
  const router = useRouter()
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [inviteRefreshKey, setInviteRefreshKey] = useState(0)

  const teamId = typeof id === 'string' ? id : ''

  const {
    data: teamData,
    isLoading: isTeamLoading,
    isFetching: isTeamFetching,
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
    isLoading: isMembersLoading,
    error: membersError,
    refetch: refetchMembers,
  } = api.teams.members.list.useQuery(
    { teamId },
    {
      enabled: Boolean(teamId),
      retry: false,
    }
  )

  const {
    data: pendingInvitationsData,
    isLoading: isInvitationsLoading,
    refetch: refetchPendingInvitations,
  } = api.teams.invitations.list.useQuery(
    {
      teamId,
      status: 'pending',
    },
    {
      enabled: Boolean(teamId),
      retry: false,
    }
  )

  const {
    data: jobsData,
    isLoading: isJobsLoading,
    error: jobsError,
    refetch: refetchJobs,
  } = api.office.listJobs.useQuery(
    {
      team_id: teamId || undefined,
      limit: 20,
      offset: 0,
    },
    {
      enabled: Boolean(teamId),
      retry: false,
    }
  )

  const { roles } = useUserRoles()
  const team = teamData?.team as TeamRecord | undefined

  if (!teamId) {
    return (
      <CenteredMessageCard
        title="Team not specified"
        description="Provide a team identifier to view details."
        actionLabel="Back to teams"
        onAction={() => router.replace(ROUTES.OFFICE_CMS_TEAMS.path)}
      />
    )
  }

  if ((isTeamLoading || isTeamFetching) && !team) {
    return (
      <YStack flex={1} items="center" justify="center" gap="$3">
        <Spinner size="large" />
        <Text color="$color11">Loading team details…</Text>
      </YStack>
    )
  }

  if (teamError || !team) {
    const message =
      teamError instanceof Error
        ? teamError.message
        : 'We were unable to load this team. Please try again.'
    return (
      <CenteredMessageCard
        title="Unable to load team"
        description={message}
        actionLabel="Retry"
        onAction={() => void refetchTeam()}
      />
    )
  }

  const members = (membersData?.members ?? []) as TeamMembersOutput['members']
  const memberCount = Array.isArray(members) ? members.length : undefined

  const pendingInvitations = (pendingInvitationsData?.invitations ??
    []) as TeamInvitationOutput['invitations']
  const pendingInvitationsCount = Array.isArray(pendingInvitations)
    ? pendingInvitations.length
    : undefined

  const teamJobs = useMemo(() => {
    return ((jobsData?.jobs ?? []) as TeamJobRecord[]) ?? []
  }, [jobsData?.jobs])
  const jobCount = teamJobs.length

  const permittedRoles = new Set(['super_admin', 'partner_admin', 'office', 'admin', 'manager'])
  const canManageTeam = roles.some((role: string) => permittedRoles.has(role))

  const quickActions = canManageTeam
    ? [
        <Button
          key="edit"
          size="$2"
          variant="outlined"
          icon={Pencil}
          onPress={() => router.push(RouteBuilder.officeTeamsEdit(team.id))}
        >
          Edit team
        </Button>,
        <Button
          key="analytics"
          size="$2"
          variant="outlined"
          icon={BarChart3}
          onPress={() => router.push(RouteBuilder.officeTeamsAnalytics(team.id))}
        >
          View analytics
        </Button>,
        <Button key="invite" size="$2" icon={UserPlus} onPress={() => setIsInviteModalOpen(true)}>
          Invite member
        </Button>,
        <Button
          key="assign"
          size="$2"
          icon={Briefcase}
          onPress={() =>
            router.push({
              pathname: ROUTES.OFFICE_CMS_JOBS_CREATE.path,
              params: { teamId: team.id },
            })
          }
        >
          Assign job
        </Button>,
      ]
    : null

  const jobsErrorInstance = jobsError instanceof Error ? jobsError : null

  return (
    <>
      <ScrollView>
        <YStack flex={1} gap="$6" p="$4">
          <XStack>
            <Button
              size="$2"
              variant="outlined"
              icon={ArrowLeft}
              onPress={() => router.push(ROUTES.OFFICE_CMS_TEAMS.path)}
            >
              Back to teams
            </Button>
          </XStack>

          <TeamOverviewCard
            team={team}
            actions={
              quickActions ? (
                <XStack gap="$2" flexWrap="wrap" justify="flex-end">
                  {quickActions}
                </XStack>
              ) : undefined
            }
            stats={{
              memberCount,
              jobCount,
              pendingInvitations: pendingInvitationsCount,
            }}
          />

          <Button
            size="$3"
            variant="outlined"
            icon={BarChart3}
            onPress={() => router.push(RouteBuilder.officeTeamsAnalytics(team.id))}
          >
            View analytics
          </Button>

          <YStack gap="$4">
            <TeamMembersList teamId={team.id} organizationId={team.organizationId} />

            <TeamJobsList
              teamId={team.id}
              jobs={teamJobs}
              isLoading={isJobsLoading}
              error={jobsErrorInstance}
              onRefresh={() => {
                void refetchJobs()
              }}
              onCreateJob={() =>
                router.push({
                  pathname: ROUTES.OFFICE_CMS_JOBS_CREATE.path,
                  params: { teamId: team.id },
                })
              }
            />

            <TeamInvitationsList
              teamId={team.id}
              refreshKey={inviteRefreshKey}
              headerAction={
                canManageTeam ? (
                  <Button size="$2" icon={UserPlus} onPress={() => setIsInviteModalOpen(true)}>
                    Invite member
                  </Button>
                ) : null
              }
            />
          </YStack>

          {(isMembersLoading || membersError) && (
            <InfoBanner
              icon={RefreshCcw}
              title="Member list status"
              message={
                membersError instanceof Error
                  ? membersError.message
                  : isMembersLoading
                    ? 'Refreshing team members…'
                    : 'Unable to load team members.'
              }
              onAction={() => void refetchMembers()}
            />
          )}

          {isInvitationsLoading && (
            <YStack gap="$2" borderWidth={1} borderColor="$borderColor" rounded="$4" p="$3">
              <Spinner size="small" />
              <Text color="$color11">Updating invitation statistics…</Text>
            </YStack>
          )}
        </YStack>
      </ScrollView>

      <TeamInviteModal
        open={isInviteModalOpen}
        onOpenChange={(open) => setIsInviteModalOpen(open)}
        teamId={team.id}
        organizationId={team.organizationId}
        defaultRoleId={team.defaultRoleId ?? team.defaultRole?.id ?? null}
        onInvited={() => {
          setInviteRefreshKey((value) => value + 1)
          void refetchPendingInvitations()
          void refetchMembers()
        }}
      />
    </>
  )
}

function CenteredMessageCard({
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
    <YStack flex={1} items="center" justify="center" gap="$3" px="$4">
      <Card p="$4" borderWidth={1} borderColor="$borderColor" bg="$color2" gap="$3">
        <Text fontSize="$6" fontWeight="700">
          {title}
        </Text>
        <Text color="$color11">{description}</Text>
        <Button onPress={onAction}>{actionLabel}</Button>
      </Card>
    </YStack>
  )
}

function InfoBanner({
  icon: Icon,
  title,
  message,
  onAction,
}: {
  icon: ComponentType<{ size?: number }>
  title: string
  message: string
  onAction: () => void
}) {
  return (
    <Card borderWidth={1} borderColor="$borderColor" bg="$color2" p="$4" gap="$3">
      <XStack gap="$2" items="center">
        <Icon size={18} />
        <Text fontSize="$5" fontWeight="700">
          {title}
        </Text>
      </XStack>
      <Text color="$color11">{message}</Text>
      <Button size="$3" onPress={onAction}>
        Refresh
      </Button>
    </Card>
  )
}
