import { useMemo, useState } from 'react'
import { Avatar, Button, Card, Spinner, Text, XStack, YStack } from 'tamagui'
import { Plus, UserMinus } from '@tamagui/lucide-icons'
import { useToastController } from '@tamagui/toast'

import { api } from '@app/core/utils/api'
import { useTeamFormOptions, type TeamRoleOption } from '../hooks/useTeamFormOptions'
import { AddTeamMemberModal } from './AddTeamMemberModal'
import { RemoveMemberModal } from './RemoveMemberModal'
import { TeamMemberRoleSelect } from './TeamMemberRoleSelect'

interface TeamMembersListProps {
  teamId: string
  organizationId: string
}

interface TeamMember {
  id: string
  userId?: string | null
  status: string
  roleId?: string | null
  roleKey?: string | null
  displayName?: string | null
  username?: string | null
  avatarPath?: string | null
}

export function TeamMembersList({ teamId, organizationId }: TeamMembersListProps) {
  const toast = useToastController()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null)

  const membersQuery = api.teams.members.list.useQuery(
    { teamId },
    {
      refetchOnWindowFocus: true,
    },
  )

  const { roles, isLoading: isLoadingRoles } = useTeamFormOptions({ organizationId })

  const members = useMemo(() => {
    return (membersQuery.data?.members ?? []).map((member) => ({
      id: member.id,
      userId: member.userId,
      status: member.status,
      roleId: member.role?.id ?? null,
      roleKey: member.role?.key ?? null,
      displayName: member.user?.displayName ?? member.user?.username ?? 'Unknown member',
      username: member.user?.username ?? null,
      avatarPath: member.user?.avatarPath ?? null,
      raw: member,
    }))
  }, [membersQuery.data?.members])

  const hasMembers = members.length > 0

  const handleRoleChange = () => {
    membersQuery.refetch()
  }

  const handleMemberAdded = () => {
    toast.show('Member added', { message: 'The team roster has been updated.' })
    membersQuery.refetch()
  }

  const handleMemberRemoved = () => {
    toast.show('Member removed', { message: 'The member no longer has access to this team.' })
    setMemberToRemove(null)
    membersQuery.refetch()
  }

  return (
    <YStack gap="$4" flex={1}>
      <XStack justify="space-between" items="center">
        <Text fontSize="$6" fontWeight="700">
          Team members
        </Text>
        <Button
          icon={Plus}
          onPress={() => setIsAddModalOpen(true)}
          bg="$color9"
          color="$color1"
          size="$3"
        >
          Add Member
        </Button>
      </XStack>

      {membersQuery.isLoading ? (
        <YStack items="center" justify="center" py="$8" gap="$2">
          <Spinner size="large" />
          <Text color="$color11">Loading team members…</Text>
        </YStack>
      ) : hasMembers ? (
        <YStack gap="$3">
          {members.map((member) => (
            <Card key={member.id} padding="$4" borderColor="$borderColor" borderWidth={1} gap="$3">
              <XStack gap="$3" items="center" justify="space-between">
                <XStack gap="$3" items="center">
                  <Avatar circular size="$4">
                    <Avatar.Image accessibilityLabel={member.displayName ?? 'Member avatar'} src={member.avatarPath ?? undefined} />
                    <Avatar.Fallback>{member.displayName?.[0] ?? '?'}</Avatar.Fallback>
                  </Avatar>
                  <YStack>
                    <Text fontWeight="600">{member.displayName}</Text>
                    {member.username ? (
                      <Text fontSize="$3" color="$color11">
                        @{member.username}
                      </Text>
                    ) : null}
                  </YStack>
                </XStack>
                <XStack gap="$3" items="center">
                  <TeamMemberRoleSelect
                    teamId={teamId}
                    teamMemberId={member.id}
                    currentRoleId={member.roleId ?? undefined}
                    roles={roles as TeamRoleOption[]}
                    disabled={isLoadingRoles}
                    onRoleChanged={handleRoleChange}
                  />
                  <Button
                    variant="outlined"
                    color="$red10"
                    icon={UserMinus}
                    onPress={() =>
                      setMemberToRemove({
                        id: member.id,
                        userId: member.userId,
                        displayName: member.displayName,
                      })
                    }
                  >
                    Remove
                  </Button>
                </XStack>
              </XStack>
              <Text fontSize="$3" color="$color11">
                Status: {member.status === 'active' ? 'Active' : member.status}
              </Text>
            </Card>
          ))}
        </YStack>
      ) : (
        <YStack gap="$2" borderWidth={1} borderColor="$borderColor" rounded="$4" p="$4" bg="$color2">
          <Text fontWeight="600">No team members yet</Text>
          <Text color="$color11">Add collaborators to this team to manage jobs and applications together.</Text>
        </YStack>
      )}

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
    </YStack>
  )
}


