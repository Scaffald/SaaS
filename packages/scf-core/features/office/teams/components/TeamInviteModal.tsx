import {
  TEAM_INVITATION_TTL_DEFAULT,
  TEAM_INVITATION_TTL_MAX,
  TEAM_INVITATION_TTL_MIN,
} from '@scf/schemas'
import { useInviteTeamMember } from '@scaffald/sdk/react'
import { ResponsiveModal, useThemeContext } from '@unicornlove/beyond-ui'
import { ResponsiveSelect } from '@unicornlove/beyond-ui'
import { UserSearch } from '@scf/core/components/user'
import { Mail, UserPlus } from 'lucide-react-native'
import { useToast } from '@unicornlove/beyond-ui'
import { useEffect, useMemo, useState } from 'react'
import {
  Button,
  Input,
  Label,
  RadioGroup,
  Spinner,
  Text,
  TextArea,
  Row,
  Stack,
} from '@unicornlove/beyond-ui'

import { type TeamRoleOption, useTeamFormOptions } from '../hooks/useTeamFormOptions'
import { colors } from '@unicornlove/beyond-ui/tokens'

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
  const { theme } = useThemeContext()
  const toast = useToast()
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

  const inviteMutation = useInviteTeamMember({
    onSuccess: () => {
      toast.show({
        title: 'Invitation sent',
        message: inviteType === 'email' ? email : `${selectedUserName || 'Member'} can now join.`,
        variant: 'success',
      })
      onOpenChange(false)
      onInvited?.()
    },
    onError: (error: unknown) => {
      const _message = error instanceof Error ? error.message : 'An error occurred'
      toast.show({
        title: 'Unable to send invitation',
        variant: 'error',
      })
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
      params: {
        email: inviteType === 'email' ? email.trim().toLowerCase() : '',
        roleId,
        message: message.trim() ? message.trim() : undefined,
      },
    })
  }

  const inviteTypeDescription =
    inviteType === 'email'
      ? 'Send an email invitation to someone who is not yet part of the organization.'
      : 'Invite an existing organization member without sending an email.'

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title="Invite team member"
      testID="modal"
    >
      <Stack gap={16}>
        <Stack gap={8}>
          <Text style={{ color: colors.text[theme].secondary }}>{inviteTypeDescription}</Text>
          <RadioGroup
            value={inviteType}
            onValueChange={(next) => setInviteType(next as InviteType)}
            orientation="horizontal"
            gap={12}
          >
            <Row gap={8} align="center">
              <RadioGroup.Item value="email" id="invite-email" size="sm" />
              <Label htmlFor="invite-email">Email invite</Label>
            </Row>
            <Row gap={8} align="center">
              <RadioGroup.Item value="user" id="invite-user" size="sm" />
              <Label htmlFor="invite-user">Existing member</Label>
            </Row>
          </RadioGroup>
        </Stack>

        {inviteType === 'email' ? (
          <Stack gap={8}>
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
              <Text style={{ color: colors.text[theme].error }}>{formError}</Text>
            ) : null}
          </Stack>
        ) : (
          <Stack gap={8}>
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
          </Stack>
        )}

        <Stack gap={8}>
          <Label>Team role</Label>
          {isLoadingRoles ? (
            <Row gap={8} align="center">
              <Spinner size="sm" />
              <Text style={{ color: colors.text[theme].secondary }}>Loading roles…</Text>
            </Row>
          ) : roleOptions.length === 0 ? (
            <Text style={{ color: colors.text[theme].secondary }}>
              No roles are configured for this organization.
            </Text>
          ) : (
            <ResponsiveSelect
              value={selectedRoleId || defaultRoleId || roleOptions[0]?.id || ''}
              onValueChange={setSelectedRoleId}
              placeholder="Select a team role"
              disabled={inviteMutation.isPending}
              options={roleOptions.map((role) => ({
                value: role.id,
                label: role.name,
              }))}
            />
          )}
        </Stack>

        <Stack gap={8}>
          <Label htmlFor="team-invite-message">Message (optional)</Label>
          <TextArea
            id="team-invite-message"
            value={message}
            onChangeText={setMessage}
            placeholder="Provide additional context for the invitee…"
            rows={3}
            disabled={inviteMutation.isPending}
          />
        </Stack>

        <Stack gap={8}>
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
          <Text style={{ color: colors.text[theme].secondary }}>
            Defaults to {TEAM_INVITATION_TTL_DEFAULT} days. Minimum {TEAM_INVITATION_TTL_MIN},
            maximum {TEAM_INVITATION_TTL_MAX}.
          </Text>
        </Stack>

        {formErrorSource === 'general' && formError ? (
          <Text style={{ color: colors.text[theme].error }}>{formError}</Text>
        ) : null}

        <Row gap={12} justify="flex-end">
          <Button
            variant="outline"
            disabled={inviteMutation.isPending}
            onPress={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            style={{ backgroundColor: colors.bg[theme].primary }}
            style={{ color: colors.text[theme].secondary }}
            iconStart={inviteType === 'email' ? Mail : UserPlus}
            onPress={handleSubmit}
            disabled={inviteMutation.isPending || (inviteType === 'email' && !email.trim())}
          >
            {inviteMutation.isPending ? (
              <Spinner size="sm" style={{ color: colors.text[theme].secondary }} />
            ) : (
              'Send Invitation'
            )}
          </Button>
        </Row>
      </Stack>
    </ResponsiveModal>
  )
}
