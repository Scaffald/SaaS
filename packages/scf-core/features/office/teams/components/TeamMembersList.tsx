import { ROUTES } from '@scf/core/constants/routes'
import { api } from '@scf/core/utils/api'
import { useUser } from '@scf/core/utils/useUser'
import type { AppRouter } from '@scf/supabase/client-types'
import { Crown, LogOut, Plus, UserMinus } from 'lucide-react-native'
import { useToast } from '@unicornlove/beyond-ui'
import type { inferRouterOutputs } from '@trpc/server'
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import {
  AlertDialog,
  Avatar,
  Button,
  Card,
  Spinner,
  Text,
  TextArea,
  Row,
  Stack,
} from '@unicornlove/beyond-ui'
import { type TeamRoleOption, useTeamFormOptions } from '../hooks/useTeamFormOptions'

import { AddTeamMemberModal } from './AddTeamMemberModal'
import { RemoveMemberModal } from './RemoveMemberModal'
import { TeamMemberRoleSelect } from './TeamMemberRoleSelect'

interface TeamMembersListProps {
  teamId: string
  organizationId: string
}

type MembersListOutput = inferRouterOutputs<AppRouter>['teams']['members']['list']
type MemberRecord = NonNullable<MembersListOutput['members']>[number]
type WorkloadOutput = inferRouterOutputs<AppRouter>['teams']['analytics']['workload']
type WorkloadSnapshot = WorkloadOutput['snapshots'][number]

interface TeamMember {
  id: string
  userId?: string | null
  status: string
  roleId?: string | null
  roleKey?: string | null
  displayName?: string | null
  username?: string | null
  avatarPath?: string | null
  record: MemberRecord
}

export function TeamMembersList({ teamId, organizationId }: TeamMembersListProps) {
  const toast = useToast()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null)
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false)
  const [leaveReason, setLeaveReason] = useState('')
  const router = useRouter()
  const { user: currentUser } = useUser()

  const membersQuery = api.teams.members.list.useQuery(
    { teamId },
    {
      refetchOnWindowFocus: true,
    }
  )

  const workloadQuery = api.teams.analytics.workload.useQuery(
    { teamId, includeHistorical: false },
    {
      enabled: Boolean(teamId),
      refetchOnWindowFocus: true,
    }
  )

  const { roles, isLoading: isLoadingRoles } = useTeamFormOptions({ organizationId })

  const transferOwnershipMutation = api.teams.members.transferOwnership.useMutation({
    onSuccess: () => {
      toast.show({
          title: 'Ownership transferred',
          message: 'Team ownership has been updated.',
        })
      void membersQuery.refetch()
    },
    onError: (error: unknown) => {
      const _message = error instanceof Error ? error.message : 'An error occurred'
      toast.show({
          title: 'Unable to transfer ownership',
          variant: 'error',
        })
    },
  })

  const selfRemoveMutation = api.teams.members.selfRemove.useMutation({
    onSuccess: () => {
      toast.show({
          title: 'You left the team',
          message: 'Redirecting to teams list.',
        })
      setLeaveReason('')
      setIsLeaveDialogOpen(false)
      router.replace(ROUTES.OFFICE.CMS.TEAMS.path)
    },
    onError: (error: unknown) => {
      const _message = error instanceof Error ? error.message : 'An error occurred'
      toast.show({
          title: 'Unable to leave team',
          variant: 'error',
        })
      setIsLeaveDialogOpen(false)
    },
  })

  const members = useMemo<TeamMember[]>(() => {
    const list = (membersQuery.data?.members ?? []) as MemberRecord[]
    return list.map((member) => ({
      id: member.id,
      userId: member.userId,
      status: member.status,
      roleId: member.role?.id ?? null,
      roleKey: member.role?.key ?? null,
      displayName: member.user?.displayName ?? member.user?.username ?? 'Unknown member',
      username: member.user?.username ?? null,
      avatarPath: member.user?.avatarPath ?? null,
      record: member,
    }))
  }, [membersQuery.data?.members])

  const workloadsByMemberId = useMemo(() => {
    const map = new Map<string, WorkloadSnapshot>()
    for (const snapshot of workloadQuery.data?.snapshots ?? []) {
      map.set(snapshot.teamMemberId, snapshot)
    }
    return map
  }, [workloadQuery.data?.snapshots])

  const hasMembers = members.length > 0
  const viewerMembership = useMemo(
    () => members.find((member) => member.userId === currentUser?.id) ?? null,
    [members, currentUser?.id]
  )
  const canTransferOwnership = viewerMembership?.roleKey === 'admin'

  const handleRoleChange = () => {
    membersQuery.refetch()
  }

  const handleMemberAdded = () => {
    toast.show({
          title: 'Member added',
          message: 'The team roster has been updated.',
        })
    membersQuery.refetch()
  }

  const handleMemberRemoved = () => {
    toast.show({
          title: 'Member removed',
          message: 'The member no longer has access to this team.',
        })
    setMemberToRemove(null)
    membersQuery.refetch()
  }

  const handleTransferOwnership = async (member: TeamMember) => {
    await transferOwnershipMutation.mutateAsync({
      teamId,
      memberId: member.id,
      roleKey: 'admin',
      notify: true,
    })
  }

  const handleLeaveTeam = async () => {
    await selfRemoveMutation.mutateAsync({
      teamId,
      reason: leaveReason.trim() ? leaveReason.trim() : undefined,
    })
  }

  const isLoadingMembers = membersQuery.isLoading || workloadQuery.isLoading
  const workloadErrorMessage = workloadQuery.error?.message ?? null

  return (
    <Stack gap="$4" flex={1} paddingHorizontal="$3" $md={{ paddingHorizontal: undefined }}>
      <Row
        justifyContent="space-between"
        alignItems="flex-start"
        gap="$3"
        flexDirection="column"
        width="100%"
        $md={{
          alignItems: 'center',
          flexDirection: 'row',
        }}
      >
        <Text fontSize="$6" fontWeight="700" accessibilityRole="header">
          Team members
        </Text>
        <Button
          icon={Plus}
          onPress={() => setIsAddModalOpen(true)}
          backgroundColor="$color9"
          color="$color1"
          size="$3"
          accessibilityLabel="Add a new team member"
          width="100%"
          $md={{ width: undefined }}
        >
          Add Member
        </Button>
      </Row>

      {isLoadingMembers ? (
        <Stack alignItems="center" justifyContent="center" paddingVertical="$8" gap="$2">
          <Spinner size="large" />
          <Text color="$color11">Loading team members…</Text>
        </Stack>
      ) : hasMembers ? (
        <Stack gap="$3">
          {workloadErrorMessage ? (
            <Text color="$red10" fontSize="$3">
              Unable to load workload snapshots: {workloadErrorMessage}
            </Text>
          ) : null}
          {members.map((member) => {
            const workload = workloadsByMemberId.get(member.id)
            const availabilityLabel =
              typeof workload?.availabilityScore === 'number'
                ? workload.availabilityScore <= 1
                  ? `${Math.round(workload.availabilityScore * 100)}%`
                  : workload.availabilityScore.toFixed(0)
                : null
            const isSelf = member.userId === currentUser?.id
            const canTransferToMember =
              canTransferOwnership && !isSelf && member.status === 'active'

            const memberRoleName = member.record.role?.name ?? 'Member'
            const memberStatusLabel = member.status === 'active' ? 'Active' : member.status

            return (
              <Card
                key={member.id}
                padding="$4"
                borderColor="$borderColor"
                borderWidth={1}
                gap="$3"
                accessible
                accessibilityRole="summary"
                accessibilityLabel={`${member.displayName ?? 'Team member'} · Role ${memberRoleName} · Status ${memberStatusLabel}`}
                width="100%"
              >
                <Row
                  gap="$3"
                  alignItems="flex-start"
                  justifyContent="space-between"
                  flexDirection="column"
                  width="100%"
                  $md={{
                    alignItems: 'center',
                    flexDirection: 'row',
                  }}
                >
                  <Row
                    gap="$3"
                    width="100%"
                    flexDirection="column"
                    alignItems="flex-start"
                    $md={{
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                  >
                    <Avatar circular size="$4">
                      <Avatar.Image
                        accessibilityLabel={member.displayName ?? 'Member avatar'}
                        src={member.avatarPath ?? undefined}
                      />
                      <Avatar.Fallback>{member.displayName?.[0] ?? '?'}</Avatar.Fallback>
                    </Avatar>
                    <Stack>
                      <Text fontWeight="600">{member.displayName}</Text>
                      {member.username ? (
                        <Text fontSize="$3" color="$color11">
                          @{member.username}
                        </Text>
                      ) : null}
                    </Stack>
                  </Row>
                  <Row
                    gap="$3"
                    flexWrap="wrap"
                    width="100%"
                    flexDirection="column"
                    justifyContent="flex-start"
                    alignItems="stretch"
                    $md={{
                      flexDirection: 'row',
                      justify: 'flex-end',
                      items: 'center',
                    }}
                  >
                    <Stack width="100%" $md={{ width: undefined }}>
                      <TeamMemberRoleSelect
                        teamId={teamId}
                        userId={member.userId ?? ''}
                        currentRoleId={member.roleId ?? undefined}
                        roles={roles as TeamRoleOption[]}
                        disabled={isLoadingRoles}
                        onRoleChanged={handleRoleChange}
                        fullWidth={true}
                      />
                    </Stack>
                    {canTransferToMember ? (
                      <Button
                        size="$2"
                        variant="outlined"
                        icon={Crown}
                        disabled={transferOwnershipMutation.isPending}
                        onPress={() => void handleTransferOwnership(member)}
                        accessibilityLabel={`Promote ${member.displayName ?? 'this member'} to team owner`}
                        accessibilityHint="Updates the member's permissions and notifies the team"
                        width="100%"
                        $md={{ width: undefined }}
                      >
                        Make owner
                      </Button>
                    ) : null}
                    <Button
                      variant="outlined"
                      color="$red10"
                      icon={UserMinus}
                      onPress={() =>
                        setMemberToRemove({
                          id: member.id,
                          userId: member.userId,
                          displayName: member.displayName,
                          status: member.status,
                          roleId: member.roleId,
                          roleKey: member.roleKey,
                          avatarPath: member.avatarPath,
                          record: member.record,
                        })
                      }
                      accessibilityLabel={`Remove ${member.displayName ?? 'this member'} from the team`}
                      accessibilityHint="Opens a dialog to confirm removal"
                      width="100%"
                      $md={{ width: undefined }}
                    >
                      Remove
                    </Button>
                  </Row>
                </Row>
                <Text fontSize="$3" color="$color11">
                  Status: {memberStatusLabel}
                </Text>
                {workload ? (
                  <Row gap="$3" flexWrap="wrap">
                    <Text fontSize="$2" color="$color10">
                      Active: {workload.activeAssignments}
                    </Text>
                    <Text fontSize="$2" color="$color10">
                      Pending: {workload.pendingAssignments}
                    </Text>
                    {workload.overdueAssignments > 0 ? (
                      <Text fontSize="$2" color="$red10">
                        Overdue: {workload.overdueAssignments}
                      </Text>
                    ) : null}
                    <Text fontSize="$2" color="$color10">
                      Reviews completed: {workload.completedReviews}
                    </Text>
                    {availabilityLabel ? (
                      <Text fontSize="$2" color="$color10">
                        Availability: {availabilityLabel}
                      </Text>
                    ) : null}
                  </Row>
                ) : null}
              </Card>
            )
          })}
        </Stack>
      ) : (
        <Stack
          gap="$2"
          borderWidth={1}
          borderColor="$borderColor"
          borderRadius="$4"
          padding="$4"
          backgroundColor="$color2"
        >
          <Text fontWeight="600">No team members yet</Text>
          <Text color="$color11">
            Add collaborators to this team to manage jobs and applications together.
          </Text>
        </Stack>
      )}

      {viewerMembership ? (
        <Button
          variant="outlined"
          color="$red10"
          icon={LogOut}
          size="$3"
          disabled={selfRemoveMutation.isPending}
          onPress={() => setIsLeaveDialogOpen(true)}
          accessibilityLabel="Open leave team dialog"
          accessibilityHint="Opens a confirmation dialog to leave this team"
          width="100%"
          $md={{ width: undefined }}
        >
          Leave team
        </Button>
      ) : null}

      <AddTeamMemberModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        teamId={teamId}
        organizationId={organizationId}
        onAdded={handleMemberAdded}
      />

      <RemoveMemberModal
        open={Boolean(memberToRemove)}
        onOpenChange={(open) => {
          if (!open) {
            setMemberToRemove(null)
          }
        }}
        teamId={teamId}
        member={memberToRemove}
        onRemoved={handleMemberRemoved}
      />

      <AlertDialog open={isLeaveDialogOpen} onOpenChange={setIsLeaveDialogOpen}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay
            key="overlay"
            animation="quick"
            opacity={0.6}
            enterStyle={{ opacity: 0 }}
            exitStyle={{ opacity: 0 }}
          />
          <AlertDialog.Content
            key="content"
            bordered
            elevate
            animation="quick"
            enterStyle={{ opacity: 0, scale: 0.95 }}
            exitStyle={{ opacity: 0, scale: 0.95 }}
            gap="$4"
          >
            <AlertDialog.Title>Leave team</AlertDialog.Title>
            <AlertDialog.Description>
              You will lose access to jobs, applications, and notifications for this team. This
              action cannot be undone.
            </AlertDialog.Description>
            <Stack gap="$2">
              <Text fontSize="$3" color="$color11">
                Optional reason
              </Text>
              <TextArea
                value={leaveReason}
                onChangeText={setLeaveReason}
                placeholder="Let the team know why you’re leaving…"
                rows={3}
                accessibilityLabel="Reason for leaving the team"
                accessibilityHint="Optional message sent to the team about your departure"
              />
            </Stack>
            <Row gap="$3" justifyContent="flex-end">
              <AlertDialog.Cancel asChild>
                <Button variant="outlined">Cancel</Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <Button
                  backgroundColor="$red9"
                  color="$color1"
                  icon={LogOut}
                  onPress={() => void handleLeaveTeam()}
                  disabled={selfRemoveMutation.isPending}
                >
                  {selfRemoveMutation.isPending ? (
                    <Spinner size="small" color="$color1" />
                  ) : (
                    'Leave team'
                  )}
                </Button>
              </AlertDialog.Action>
            </Row>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog>
    </Stack>
  )
}
