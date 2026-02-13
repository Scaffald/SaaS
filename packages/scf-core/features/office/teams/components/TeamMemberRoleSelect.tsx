import { useUpdateTeamMember } from '@scaffald/sdk/react'
import { ResponsiveSelect } from '@unicornlove/beyond-ui'
import { useToast } from '@unicornlove/beyond-ui'
import { useEffect, useMemo, useState } from 'react'
import { Text, Stack } from '@unicornlove/beyond-ui'
import type { TeamRoleOption } from '../hooks/useTeamFormOptions'

interface TeamMemberRoleSelectProps {
  teamId: string
  userId: string
  currentRoleId?: string | null
  roles: TeamRoleOption[]
  disabled?: boolean
  onRoleChanged?: (roleId: string) => void
  fullWidth?: boolean
}

export function TeamMemberRoleSelect({
  teamId,
  userId,
  currentRoleId,
  roles,
  disabled = false,
  onRoleChanged,
  fullWidth = false,
}: TeamMemberRoleSelectProps) {
  const toast = useToast()
  const [selectedRoleId, setSelectedRoleId] = useState(currentRoleId ?? '')

  useEffect(() => {
    setSelectedRoleId(currentRoleId ?? '')
  }, [currentRoleId])

  const _roleLookup = useMemo(() => {
    const map = new Map<string, TeamRoleOption>()
    for (const role of roles) {
      map.set(role.id, role)
    }
    return map
  }, [roles])

  const updateRoleMutation = useUpdateTeamMember({
    onSuccess: (_data, variables) => {
      toast.show({
        title: 'Role updated',
        message: 'Team member role changed successfully.',
        variant: 'success',
      })
      if (variables?.params?.roleId) {
        onRoleChanged?.(variables.params.roleId)
      }
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'An error occurred'
      toast.show({
        title: 'Unable to update role',
        message,
        variant: 'error',
      })
      setSelectedRoleId(currentRoleId ?? '')
    },
  })

  const handleRoleChange = async (roleId: string) => {
    setSelectedRoleId(roleId)
    await updateRoleMutation.mutateAsync({
      teamId,
      userId,
      params: { roleId },
    })
  }

  return (
    <Stack gap={8}>
      <Text color="$gray11">Role</Text>
      <ResponsiveSelect
        value={selectedRoleId}
        onValueChange={handleRoleChange}
        placeholder="Select role"
        disabled={disabled || updateRoleMutation.isPending}
        options={roles.map((role) => ({
          value: role.id,
          label: role.name,
        }))}
        triggerProps={{
          width: fullWidth ? '100%' : undefined,
        }}
      />
    </Stack>
  )
}
