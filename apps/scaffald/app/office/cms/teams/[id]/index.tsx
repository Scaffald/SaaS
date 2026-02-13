import { ROUTES, RouteBuilder } from '@scf/core/constants/routes'
import {
  TeamInvitationsList,
  TeamInviteModal,
  TeamJobsList,
  TeamMembersList,
  TeamOverviewCard,
} from '@scf/core/features/office/teams'
import { api } from '@scf/core/utils/api'
import { useTeam, useTeamMembers, useTeamInvitations } from '@scaffald/sdk/react'
import { useUserRoles } from '@scf/core/utils/auth/useUserRoles'
import type { AppRouter } from '@scf/supabase/client-types'
import {
  ArrowLeft,
  BarChart3,
  Briefcase,
  Pencil,
  RefreshCcw,
  UserPlus,
} from 'lucide-react-native'
import type { inferRouterOutputs } from '@trpc/server'
import { useLocalSearchParams, useRouter } from 'expo-router'
import type { ComponentType } from 'react'
import { useMemo, useState } from 'react'
import { ScrollView } from 'react-native'
import { Button, Card, Spinner, Text, Row, Stack } from '@unicornlove/beyond-ui'

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
  } = useTeam(teamId, {
    enabled: Boolean(teamId),
    retry: false,
  })

  const {
    data: membersData,
    isLoading: isMembersLoading,
    error: membersError,
    refetch: refetchMembers,
  } = useTeamMembers(teamId, {
    enabled: Boolean(teamId),
    retry: false,
  })

  const {
    data: invitationsData,
    isLoading: isInvitationsLoading,
    refetch: refetchPendingInvitations,
  } = useTeamInvitations(teamId, {
    enabled: Boolean(teamId),
    retry: false,
  })

  const {
    data: jobsData,
    isLoading: isJobsLoading,
    error: jobsError,
    refetch: refetchJobs,
  } = api.office.listJobs.useQuery(
    {
      limit: 20,
      offset: 0,
      team_id: teamId || undefined,
    },
    {
      enabled: Boolean(teamId),
      retry: false,
    }
  )

  const { roles } = useUserRoles()
  const team = teamData?.team

  if (!teamId) {
    return (
      <CenteredMessageCard
        title="Team not specified"
        description="Provide a team identifier to view details."
        actionLabel="Back to teams"
        onAction={() => router.replace(ROUTES.OFFICE.CMS.TEAMS.path)}
      />
    )
  }

  if ((isTeamLoading || isTeamFetching) && !team) {
    return (
      <Stack align="center" justify="center" gap={12}>
        <Spinner size="lg" />
        <Text color="gray">Loading team details…</Text>
      </Stack>
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

  const members = membersData?.members ?? []
  const memberCount = members.length

  const allInvitations = invitationsData?.invitations ?? []
  const pendingInvitations = allInvitations.filter((inv) => inv.status === 'pending')
  const pendingInvitationsCount = pendingInvitations.length

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
          size="md"
          variant="outline"
          icon={Pencil}
          onPress={() => router.push(RouteBuilder.officeTeamsEdit(team.id))}
        >Edit team</Button>,
        <Button
          key="analytics"
          size="md"
          variant="outline"
          icon={BarChart3}
          onPress={() => router.push(RouteBuilder.officeTeamsAnalytics(team.id))}
        >View analytics</Button>,
        <Button key="invite" size="md" icon={UserPlus} onPress={() => setIsInviteModalOpen(true)}>Invite member</Button>,
        <Button
          key="assign"
          size="md"
          icon={Briefcase}
          onPress={() =>
            router.push({
              params: { teamId: team.id },
              pathname: ROUTES.OFFICE.CMS.JOBS.CREATE.path,
            })
          }
        >Assign job</Button>,
      ]
    : null

  const jobsErrorInstance = jobsError instanceof Error ? jobsError : null

  return (
    <>
      <ScrollView>
        <Stack gap={24} padding={16}>
          <Row>
            <Button
              size="md"
              variant="outline"
              icon={ArrowLeft}
              onPress={() => router.push(ROUTES.OFFICE.CMS.TEAMS.path)}
            >Back to teams</Button>
          </Row>

          <TeamOverviewCard
            team={team}
            actions={
              quickActions ? (
                <Row gap={8} justify="flex-end">
                  {quickActions}
                </Row>
              ) : undefined
            }
            stats={{
              jobCount,
              memberCount,
              pendingInvitations: pendingInvitationsCount,
            }}
          />

          <Button
            size="md"
            variant="outline"
            icon={BarChart3}
            onPress={() => router.push(RouteBuilder.officeTeamsAnalytics(team.id))}
          >View analytics</Button>

          <Stack gap={16}>
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
                  params: { teamId: team.id },
                  pathname: ROUTES.OFFICE.CMS.JOBS.CREATE.path,
                })
              }
            />

            <TeamInvitationsList
              teamId={team.id}
              refreshKey={inviteRefreshKey}
              headerAction={
                canManageTeam ? (
                  <Button size="md" icon={UserPlus} onPress={() => setIsInviteModalOpen(true)}>Invite member</Button>
                ) : null
              }
            />
          </Stack>

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
            <Stack
              gap={8}
             
             
             
              padding={12}
            >
              <Spinner size="sm" />
              <Text color="gray">Updating invitation statistics…</Text>
            </Stack>
          )}
        </Stack>
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
    <Stack align="center" justify="center" gap={12}>
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
    <Card
     
     
     
      padding={16}
      gap={12}
    >
      <Row gap={8} align="center">
        <Icon size={18} />
        <Text>
          {title}
        </Text>
      </Row>
      <Text color="gray">{message}</Text>
      <Button size="md" onPress={onAction}>Refresh</Button>
    </Card>
  )
}
