import { ResponsiveModal, useThemeContext } from '@unicornlove/beyond-ui'
import { ResponsiveSelect } from '@unicornlove/beyond-ui'
import { UserSearch } from '@scf/core/components/user'
import { useToast } from '@unicornlove/beyond-ui'
import { useEffect, useMemo, useState } from 'react'
import { Button, Spinner, Text, Row, Stack } from '@unicornlove/beyond-ui'
import { useAddTeamMember } from '@scaffald/sdk/react'

import { type TeamRoleOption, useTeamFormOptions } from '../hooks/useTeamFormOptions'
import { colors } from '@unicornlove/beyond-ui/tokens'

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
  const { theme } = useThemeContext()
  const toast = useToast()
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [selectedUserName, setSelectedUserName] = useState<string>('')
  const [selectedRoleId, setSelectedRoleId] = useState<string>('')
  const [formError, setFormError] = useState<string | null>(null)

  const { roles, isLoading: isLoadingRoles } = useTeamFormOptions({ organizationId })

  const addMemberMutation = useAddTeamMember({
    onSuccess: () => {
      toast.show({
        title: 'Member added',
        message: `${selectedUserName || 'User'} joined the team.`,
        variant: 'success',
      })
      onOpenChange(false)
      onAdded?.()
    },
    onError: (error: unknown) => {
      const _message = error instanceof Error ? error.message : 'An error occurred'
      toast.show({
        title: 'Unable to add member',
        variant: 'error',
      })
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
      params: {
        userId: selectedUserId,
        roleId,
      },
    })
  }

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange} title="Add team member">
      <Stack gap={16}>
        <Text style={{ color: colors.text[theme].secondary }}>
          Invite an existing organization member to collaborate on this team.
        </Text>

        <Stack gap={8}>
          <Text style={{ color: colors.text[theme].secondary }}>Member</Text>
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
        </Stack>

        <Stack gap={8}>
          <Text style={{ color: colors.text[theme].secondary }}>Role</Text>
          {isLoadingRoles ? (
            <Row align="center" gap={8}>
              <Spinner size="sm" />
              <Text style={{ color: colors.text[theme].secondary }}>Loading roles...</Text>
            </Row>
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
        </Stack>

        <Row gap={12} justify="flex-end">
          <Button
            variant="outline"
            disabled={addMemberMutation.isPending}
            onPress={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onPress={handleSubmit}
            style={{
              backgroundColor: colors.bg[theme].primary,
              color: colors.text[theme].secondary,
            }}
            disabled={addMemberMutation.isPending}
          >
            {addMemberMutation.isPending ? (
              <Spinner size="sm" style={{ color: colors.text[theme].secondary }} />
            ) : (
              'Add Member'
            )}
          </Button>
        </Row>
      </Stack>
    </ResponsiveModal>
  )
}
