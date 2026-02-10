import { api } from '@scf/core/utils/api'
import { ResponsiveSelect } from '@unicornlove/beyond-ui'
import { useToast } from '@unicornlove/beyond-ui'
import { useEffect, useMemo, useState } from 'react'
import { Text, Stack } from '@unicornlove/beyond-ui'
import type { TeamRoleOption } from '../hooks/useTeamFormOptions'

interface TeamMemberRoleSelectProps {
  teamId: string
  teamMemberId: string
  currentRoleId?: string | null
  roles: TeamRoleOption[]
  disabled?: boolean
  onRoleChanged?: (roleId: string) => void
  fullWidth?: boolean
}

export function TeamMemberRoleSelect({
  teamId,
  teamMemberId,
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

  const updateRoleMutation = api.teams.members.update.useMutation({
    onSuccess: (_data: unknown, variables: { roleId?: string } | undefined) => {
      toast.show({
          title: 'Role updated',
          message: 'Team member role changed successfully.',
        })
      if (variables?.roleId) {
        onRoleChanged?.(variables.roleId)
      }
    },
    onError: (error: unknown) => {
      const _message = error instanceof Error ? error.message : 'An error occurred'
      toast.show({
          title: 'Unable to update role',
          variant: 'error',
        })
      setSelectedRoleId(currentRoleId ?? '')
    },
  })

  const handleRoleChange = async (roleId: string) => {
    setSelectedRoleId(roleId)
    await updateRoleMutation.mutateAsync({
      teamMemberId,
      teamId,
      roleId,
    })
  }

  return (
    <Stack gap="$2">
      <Text fontSize="$3" color="$color11">
        Role
      </Text>
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
