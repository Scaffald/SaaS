import { api } from '@app/core/utils/api'
import { ResponsiveModal } from '@scaffald/neue-ui'
import { ResponsiveSelect } from '@scaffald/neue-ui'
import { UserSearch } from '@app/core/components/user'
import { useToastController } from '@tamagui/toast'
import { useEffect, useMemo, useState } from 'react'
import { Button, Spinner, Text, XStack, YStack } from 'tamagui'

import { type TeamRoleOption, useTeamFormOptions } from '../hooks/useTeamFormOptions'

interface AddTeamMemberModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  teamId: string
  organizationId: string
  onAdded?: () => void
}

export function AddTeamMemberModal({
  open,
  onOpenChange,
  teamId,
  organizationId,
  onAdded,
}: AddTeamMemberModalProps) {
  const toast = useToastController()
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [selectedUserName, setSelectedUserName] = useState<string>('')
  const [selectedRoleId, setSelectedRoleId] = useState<string>('')
  const [formError, setFormError] = useState<string | null>(null)

  const { roles, isLoading: isLoadingRoles } = useTeamFormOptions({ organizationId })

  const addMemberMutation = api.teams.members.add.useMutation({
    onSuccess: () => {
      toast.show('Member added', { message: `${selectedUserName || 'User'} joined the team.` })
      onOpenChange(false)
      onAdded?.()
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'An error occurred'
      toast.show('Unable to add member', { message })
    },
  })

  useEffect(() => {
    if (open) {
      setSelectedUserId('')
      setSelectedUserName('')
      setSelectedRoleId('')
      setFormError(null)
    }
  }, [open])

  const roleOptions: TeamRoleOption[] = useMemo(() => roles, [roles])

  const handleSubmit = async () => {
    if (!selectedUserId) {
      setFormError('Select a user to add to the team.')
      return
    }

    const roleId = selectedRoleId || roleOptions[0]?.id
    if (!roleId) {
      setFormError('No team roles are available for this organization.')
      return
    }

    setFormError(null)

    await addMemberMutation.mutateAsync({
      teamId,
      userId: selectedUserId,
      roleId,
    })
  }

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange} title="Add team member">
      <YStack gap="$4">
        <Text color="$color11">
          Invite an existing organization member to collaborate on this team.
        </Text>

        <YStack gap="$2">
          <Text fontSize="$3" color="$color11">
            Member
          </Text>
          <UserSearch
            value={selectedUserId}
            onUserSelect={(id, name) => {
              setSelectedUserId(id)
              setSelectedUserName(name)
              setFormError(null)
            }}
            placeholder="Search organization members…"
            error={formError ?? undefined}
            disabled={addMemberMutation.isPending}
          />
        </YStack>

        <YStack gap="$2">
          <Text fontSize="$3" color="$color11">
            Role
          </Text>
          {isLoadingRoles ? (
            <XStack items="center" gap="$2">
              <Spinner size="small" />
              <Text color="$color11">Loading roles...</Text>
            </XStack>
          ) : (
            <ResponsiveSelect
              value={selectedRoleId || roleOptions[0]?.id || ''}
              onValueChange={setSelectedRoleId}
              placeholder="Select role"
              options={roleOptions.map((role) => ({
                value: role.id,
                label: role.name,
              }))}
            />
          )}
        </YStack>

        <XStack gap="$3" justify="flex-end">
          <Button
            variant="outlined"
            disabled={addMemberMutation.isPending}
            onPress={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onPress={handleSubmit}
            bg="$color9"
            color="$color1"
            disabled={addMemberMutation.isPending}
          >
            {addMemberMutation.isPending ? <Spinner size="small" color="$color1" /> : 'Add Member'}
          </Button>
        </XStack>
      </YStack>
    </ResponsiveModal>
  )
}
