import { useEffect, useMemo, useState } from 'react'
import { Select, Spinner, Text, YStack } from 'tamagui'
import { Check, ChevronDown } from '@tamagui/lucide-icons'
import { useToastController } from '@tamagui/toast'

import { api } from '@app/core/utils/api'
import type { TeamRoleOption } from '../hooks/useTeamFormOptions'

interface TeamMemberRoleSelectProps {
  teamId: string
  teamMemberId: string
  currentRoleId?: string | null
  roles: TeamRoleOption[]
  disabled?: boolean
  onRoleChanged?: (roleId: string) => void
}

export function TeamMemberRoleSelect({
  teamId,
  teamMemberId,
  currentRoleId,
  roles,
  disabled = false,
  onRoleChanged,
}: TeamMemberRoleSelectProps) {
  const toast = useToastController()
  const [selectedRoleId, setSelectedRoleId] = useState(currentRoleId ?? '')

  useEffect(() => {
    setSelectedRoleId(currentRoleId ?? '')
  }, [currentRoleId])

  const roleLookup = useMemo(() => {
    const map = new Map<string, TeamRoleOption>()
    for (const role of roles) {
      map.set(role.id, role)
    }
    return map
  }, [roles])

  const updateRoleMutation = api.teams.members.update.useMutation({
    onSuccess: (_, variables) => {
      toast.show('Role updated', { message: 'Team member role changed successfully.' })
      if (variables?.roleId) {
        onRoleChanged?.(variables.roleId)
      }
    },
    onError: (error) => {
      toast.show('Unable to update role', { message: error.message })
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

  const activeRole = selectedRoleId ? roleLookup.get(selectedRoleId) : undefined

  return (
    <YStack gap="$2" minWidth={200}>
      <Text fontSize="$3" color="$color11">
        Role
      </Text>
      <Select
        native
        value={selectedRoleId}
        onValueChange={handleRoleChange}
        disablePreventBodyScroll
        disabled={disabled || roles.length === 0 || updateRoleMutation.isPending}
      >
        <Select.Trigger iconAfter={ChevronDown} borderColor="$borderColor" h="$4">
          <Select.Value placeholder="Select role">
            {activeRole ? activeRole.name : 'Select role'}
          </Select.Value>
          {updateRoleMutation.isPending ? <Spinner size="small" ml="$2" /> : null}
        </Select.Trigger>
        <Select.Content zIndex={1000}>
          <Select.ScrollUpButton />
          <Select.Viewport>
            <Select.Group>
              <Select.Label>Team roles</Select.Label>
              {roles.map((role, index) => (
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
  )
}


