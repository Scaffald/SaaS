import { api } from '@app/core/utils/api'
import {
  TEAM_INVITATION_TTL_DEFAULT,
  TEAM_INVITATION_TTL_MAX,
  TEAM_INVITATION_TTL_MIN,
} from '@app/schemas'
import { ResponsiveModal } from '@app/ui/components/ResponsiveModal'
import { UserSearch } from '@app/ui/components/user/UserSearch'
import { Check, ChevronDown, Mail, UserPlus } from '@tamagui/lucide-icons'
import { useToastController } from '@tamagui/toast'
import { useEffect, useMemo, useState } from 'react'
import {
  Button,
  Input,
  Label,
  RadioGroup,
  Select,
  Spinner,
  Text,
  TextArea,
  XStack,
  YStack,
} from 'tamagui'

import { type TeamRoleOption, useTeamFormOptions } from '../hooks/useTeamFormOptions'

type InviteType = 'email' | 'user'

interface TeamInviteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  teamId: string
  organizationId: string
  defaultRoleId?: string | null
  onInvited?: () => void
}

export function TeamInviteModal({
  open,
  onOpenChange,
  teamId,
  organizationId,
  defaultRoleId,
  onInvited,
}: TeamInviteModalProps) {
  const toast = useToastController()
  const [inviteType, setInviteType] = useState<InviteType>('email')
  const [email, setEmail] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [selectedUserName, setSelectedUserName] = useState<string>('')
  const [selectedRoleId, setSelectedRoleId] = useState<string>('')
  const [expiresInDays, setExpiresInDays] = useState<number>(TEAM_INVITATION_TTL_DEFAULT)
  const [message, setMessage] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [formErrorSource, setFormErrorSource] = useState<'email' | 'user' | 'general' | null>(null)

  const { roles, isLoading: isLoadingRoles } = useTeamFormOptions({ organizationId })

  const inviteMutation = api.teams.invitations.create.useMutation({
    onSuccess: () => {
      toast.show('Invitation sent', {
        message: inviteType === 'email' ? email : `${selectedUserName || 'Member'} can now join.`,
      })
      onOpenChange(false)
      onInvited?.()
    },
    onError: (error: Error) => {
      toast.show('Unable to send invitation', { message: error.message })
    },
  })

  const roleOptions: TeamRoleOption[] = useMemo(() => roles, [roles])

  useEffect(() => {
    if (!open) {
      return
    }

    setInviteType('email')
    setEmail('')
    setSelectedUserId('')
    setSelectedUserName('')
    setExpiresInDays(TEAM_INVITATION_TTL_DEFAULT)
    setMessage('')
    setFormError(null)
    setFormErrorSource(null)
  }, [open])

  useEffect(() => {
    if (!open) {
      return
    }

    const fallbackRoleId = defaultRoleId ?? roleOptions[0]?.id ?? ''
    setSelectedRoleId(fallbackRoleId)
  }, [open, defaultRoleId, roleOptions])

  const handleSubmit = async () => {
    if (inviteMutation.isPending) {
      return
    }

    if (inviteType === 'email' && !email.trim()) {
      setFormError('Enter an email address to send the invitation.')
      setFormErrorSource('email')
      return
    }

    if (inviteType === 'user' && !selectedUserId) {
      setFormError('Select an existing member to invite.')
      setFormErrorSource('user')
      return
    }

    const roleId = selectedRoleId || defaultRoleId || roleOptions[0]?.id
    if (!roleId) {
      setFormError('No team roles are available for this organization.')
      setFormErrorSource('general')
      return
    }

    setFormError(null)
    setFormErrorSource(null)

    const clampedDays = Math.min(
      Math.max(expiresInDays, TEAM_INVITATION_TTL_MIN),
      TEAM_INVITATION_TTL_MAX
    )

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + clampedDays)

    await inviteMutation.mutateAsync({
      teamId,
      roleId,
      email: inviteType === 'email' ? email.trim().toLowerCase() : undefined,
      userId: inviteType === 'user' ? selectedUserId : undefined,
      expiresAt: expiresAt.toISOString(),
      message: message.trim() ? message.trim() : undefined,
    })
  }

  const inviteTypeDescription =
    inviteType === 'email'
      ? 'Send an email invitation to someone who is not yet part of the organization.'
      : 'Invite an existing organization member without sending an email.'

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange} title="Invite team member">
      <YStack gap="$4">
        <YStack gap="$2">
          <Text color="$color11">{inviteTypeDescription}</Text>
          <RadioGroup
            value={inviteType}
            onValueChange={(next) => setInviteType(next as InviteType)}
            orientation="horizontal"
            gap="$3"
          >
            <XStack gap="$2" items="center">
              <RadioGroup.Item value="email" id="invite-email" size="$3" />
              <Label htmlFor="invite-email">Email invite</Label>
            </XStack>
            <XStack gap="$2" items="center">
              <RadioGroup.Item value="user" id="invite-user" size="$3" />
              <Label htmlFor="invite-user">Existing member</Label>
            </XStack>
          </RadioGroup>
        </YStack>

        {inviteType === 'email' ? (
          <YStack gap="$2">
            <Label htmlFor="team-invite-email">Email</Label>
            <Input
              id="team-invite-email"
              value={email}
              onChangeText={(value) => {
                setEmail(value)
                if (formErrorSource === 'email') {
                  setFormError(null)
                  setFormErrorSource(null)
                }
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="name@example.com"
              autoFocus
              disabled={inviteMutation.isPending}
            />
            {formErrorSource === 'email' && formError ? (
              <Text color="$red10" fontSize="$3">
                {formError}
              </Text>
            ) : null}
          </YStack>
        ) : (
          <YStack gap="$2">
            <Label>Organization member</Label>
            <UserSearch
              value={selectedUserId}
              onUserSelect={(id, name) => {
                setSelectedUserId(id)
                setSelectedUserName(name)
                if (formErrorSource === 'user') {
                  setFormError(null)
                  setFormErrorSource(null)
                }
              }}
              placeholder="Search organization members…"
              disabled={inviteMutation.isPending}
              error={formError ?? undefined}
            />
          </YStack>
        )}

        <YStack gap="$2">
          <Label>Team role</Label>
          {isLoadingRoles ? (
            <XStack gap="$2" items="center">
              <Spinner size="small" />
              <Text color="$color11">Loading roles…</Text>
            </XStack>
          ) : roleOptions.length === 0 ? (
            <Text color="$color11">No roles are configured for this organization.</Text>
          ) : (
            <Select
              native
              value={selectedRoleId || defaultRoleId || roleOptions[0]?.id}
              onValueChange={setSelectedRoleId}
              disablePreventBodyScroll
            >
              <Select.Trigger iconAfter={ChevronDown} disabled={inviteMutation.isPending}>
                <Select.Value placeholder="Select a team role">
                  {roleOptions.find((role) => role.id === (selectedRoleId || defaultRoleId))
                    ?.name ?? 'Select a team role'}
                </Select.Value>
                {inviteMutation.isPending ? <Spinner size="small" ml="$2" /> : null}
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
          )}
        </YStack>

        <YStack gap="$2">
          <Label htmlFor="team-invite-message">Message (optional)</Label>
          <TextArea
            id="team-invite-message"
            value={message}
            onChangeText={setMessage}
            placeholder="Provide additional context for the invitee…"
            rows={3}
            disabled={inviteMutation.isPending}
          />
        </YStack>

        <YStack gap="$2">
          <Label htmlFor="team-invite-expiry">Invitation expires in (days)</Label>
          <Input
            id="team-invite-expiry"
            value={String(expiresInDays)}
            keyboardType="numeric"
            onChangeText={(value) => {
              const next = Number.parseInt(value, 10)
              setExpiresInDays(
                Number.isNaN(next)
                  ? TEAM_INVITATION_TTL_DEFAULT
                  : Math.max(TEAM_INVITATION_TTL_MIN, Math.min(next, TEAM_INVITATION_TTL_MAX))
              )
            }}
            disabled={inviteMutation.isPending}
          />
          <Text fontSize="$3" color="$color11">
            Defaults to {TEAM_INVITATION_TTL_DEFAULT} days. Minimum {TEAM_INVITATION_TTL_MIN},
            maximum {TEAM_INVITATION_TTL_MAX}.
          </Text>
        </YStack>

        {formErrorSource === 'general' && formError ? (
          <Text color="$red10" fontSize="$3">
            {formError}
          </Text>
        ) : null}

        <XStack gap="$3" justify="flex-end">
          <Button
            variant="outlined"
            disabled={inviteMutation.isPending}
            onPress={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            bg="$color9"
            color="$color1"
            icon={inviteType === 'email' ? Mail : UserPlus}
            onPress={handleSubmit}
            disabled={inviteMutation.isPending || (inviteType === 'email' && !email.trim())}
          >
            {inviteMutation.isPending ? (
              <Spinner size="small" color="$color1" />
            ) : (
              'Send Invitation'
            )}
          </Button>
        </XStack>
      </YStack>
    </ResponsiveModal>
  )
}
