import { useEffect, useMemo, useState } from 'react'
import { Button, Select, Spinner, Text, XStack, YStack } from 'tamagui'
import { Check, ChevronDown } from '@tamagui/lucide-icons'
import { useToastController } from '@tamagui/toast'

import { api } from '@app/core/utils/api'
import { ResponsiveModal } from '@app/ui/components/ResponsiveModal'
import { UserSearch } from '@app/ui/components/user/UserSearch'

import { useTeamFormOptions, type TeamRoleOption } from '../hooks/useTeamFormOptions'

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
    onError: (error) => {
      toast.show('Unable to add member', { message: error.message })
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
          <Select
            native
            value={selectedRoleId || roleOptions[0]?.id}
            onValueChange={setSelectedRoleId}
            disablePreventBodyScroll
          >
            <Select.Trigger iconAfter={ChevronDown}>
              <Select.Value placeholder="Select role">
                {roleOptions.find((role) => role.id === (selectedRoleId || roleOptions[0]?.id))
                  ?.name ?? 'Select role'}
              </Select.Value>
              {isLoadingRoles ? <Spinner size="small" ml="$2" /> : null}
            </Select.Trigger>
            <Select.Content zIndex={1000}>
              <Select.ScrollUpButton />
              <Select.Viewport>
                <Select.Group>
                  <Select.Label>Team roles</Select.Label>
                  {roleOptions.map((role, index) => (
                    <Select.Item key={role.id} value={role.id} index={index}>
                      <Select.ItemText>{role.name}</Select.ItemText>
                      <Select.ItemIndicator>
                        <Check size={16} />
                      </Select.ItemIndicator>
                    </Select.Item>
                  ))}
                </Select.Group>
              </Select.Viewport>
              <Select.ScrollDownButton />
            </Select.Content>
          </Select>
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


