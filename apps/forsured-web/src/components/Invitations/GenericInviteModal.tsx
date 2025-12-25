/**
 * Generic Invite Modal
 * REQ-128: Flexible Invitation System
 *
 * A universal invite modal that works with the generic invitation system.
 * Supports any invitation rule, personal messages, constraint checking,
 * and project context for project-based invitations.
 */

import { useState, useEffect } from 'react'
import { UserPlus, AlertTriangle, Check } from 'lucide-react'
import { YStack, XStack, Text, Button, Input, TextArea, SizableText } from '@unicornlove/ui'
import Modal from '../Common/Modal'
import { trpc } from '../../lib/trpc'
import type { InvitationRule } from '../../lib/invitations/types'

interface GenericInviteModalProps {
  /** Whether the modal is open */
  isOpen: boolean
  /** Callback when modal should close */
  onClose: () => void
  /** Pre-selected rule ID (if known) */
  ruleId?: string
  /** Filter rules by source role (e.g., 'broker', 'manager') */
  sourceRole?: string
  /** Project context for project-based invitations */
  projectId?: string
  /** Project name for display */
  projectName?: string
  /** Callback on successful invitation */
  onSuccess?: (invitation: { id: string; referral_code: string }) => void
}

export function GenericInviteModal({
  isOpen,
  onClose,
  ruleId: preSelectedRuleId,
  sourceRole,
  projectId,
  projectName,
  onSuccess,
}: GenericInviteModalProps) {
  // Form state
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [personalMessage, setPersonalMessage] = useState('')
  const [selectedRuleId, setSelectedRuleId] = useState(preSelectedRuleId || '')
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Fetch available rules
  const { data: allRules } = trpc.genericInvitations.getRules.useQuery(undefined, {
    enabled: isOpen,
  })

  // Filter rules based on source role
  const availableRules = sourceRole
    ? allRules?.filter((rule) => rule.source_role === sourceRole) || []
    : allRules || []

  // Get the selected rule
  const selectedRule = availableRules.find((r) => r.id === selectedRuleId)

  // Check constraint for selected email
  const { data: constraintCheck, isLoading: checkingConstraint } =
    trpc.genericInvitations.checkConstraint.useQuery(
      { ruleId: selectedRuleId, inviteeEmail: email },
      {
        enabled: !!selectedRuleId && !!email && email.includes('@'),
        retry: false,
      }
    )

  // Create invitation mutation
  const createInvitationMutation = trpc.genericInvitations.create.useMutation({
    onSuccess: (data) => {
      setSuccessMessage(`Invitation sent to ${email}!`)
      onSuccess?.(data)
      // Reset form after short delay
      setTimeout(() => {
        handleClose()
      }, 1500)
    },
    onError: (err) => {
      setError(err.message || 'Failed to send invitation. Please try again.')
    },
  })

  // Auto-select rule if only one available or preselected
  useEffect(() => {
    if (preSelectedRuleId) {
      setSelectedRuleId(preSelectedRuleId)
    } else if (availableRules.length === 1) {
      setSelectedRuleId(availableRules[0].id)
    }
  }, [preSelectedRuleId, availableRules])

  const handleSubmit = async () => {
    setError(null)

    // Validate email
    if (!email.trim()) {
      setError('Email is required')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address')
      return
    }

    // Validate rule selection
    if (!selectedRuleId) {
      setError('Please select an invitation type')
      return
    }

    // Validate project for project-based rules
    if (selectedRule?.requires_project && !projectId) {
      setError('This invitation type requires a project context')
      return
    }

    // Create the invitation
    createInvitationMutation.mutate({
      ruleId: selectedRuleId,
      inviteeEmail: email.trim(),
      inviteeName: name.trim() || undefined,
      personalMessage: personalMessage.trim() || undefined,
      projectId: projectId || undefined,
    })
  }

  const handleClose = () => {
    setEmail('')
    setName('')
    setPersonalMessage('')
    setSelectedRuleId(preSelectedRuleId || '')
    setError(null)
    setSuccessMessage(null)
    onClose()
  }

  const isLoading = createInvitationMutation.isPending

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Send Invitation" size="medium">
      <YStack gap="$4">
        {/* Success Message */}
        {successMessage && (
          <YStack
            backgroundColor="$green2"
            borderWidth={1}
            borderColor="$green6"
            borderRadius="$4"
            padding="$3"
          >
            <XStack alignItems="center" gap="$2">
              <Check size={16} color="var(--green11)" />
              <SizableText fontSize="$3" color="$green11">
                {successMessage}
              </SizableText>
            </XStack>
          </YStack>
        )}

        {/* Error Message */}
        {error && (
          <YStack
            backgroundColor="$red2"
            borderWidth={1}
            borderColor="$red6"
            borderRadius="$4"
            padding="$3"
          >
            <SizableText fontSize="$3" color="$red11">
              {error}
            </SizableText>
          </YStack>
        )}

        {/* Constraint Warning */}
        {constraintCheck && !constraintCheck.allowed && (
          <YStack
            backgroundColor="$yellow2"
            borderWidth={1}
            borderColor="$yellow6"
            borderRadius="$4"
            padding="$3"
          >
            <XStack alignItems="flex-start" gap="$2">
              <AlertTriangle size={16} color="var(--yellow11)" style={{ marginTop: 2 }} />
              <YStack flex={1}>
                <SizableText fontSize="$3" fontWeight="500" color="$yellow11">
                  Relationship Constraint
                </SizableText>
                <SizableText fontSize="$2" color="$yellow11" marginTop="$1">
                  {constraintCheck.reason}
                </SizableText>
                {selectedRule?.allow_referral_only && (
                  <SizableText fontSize="$2" color="$yellow10" marginTop="$2">
                    The invitation will still be sent, but no relationship will be created.
                  </SizableText>
                )}
              </YStack>
            </XStack>
          </YStack>
        )}

        {/* Rule Selection (if multiple rules available) */}
        {availableRules.length > 1 && !preSelectedRuleId && (
          <YStack gap="$2">
            <SizableText fontSize="$3" fontWeight="500" color="$color12">
              Invitation Type
            </SizableText>
            <YStack gap="$2">
              {availableRules.map((rule) => (
                <XStack
                  key={rule.id}
                  padding="$3"
                  borderWidth={1}
                  borderColor={selectedRuleId === rule.id ? '$blue8' : '$borderColor'}
                  borderRadius="$4"
                  backgroundColor={selectedRuleId === rule.id ? '$blue2' : 'transparent'}
                  cursor="pointer"
                  hoverStyle={{ backgroundColor: '$color2' }}
                  onPress={() => setSelectedRuleId(rule.id)}
                  alignItems="center"
                  gap="$3"
                >
                  <input
                    type="radio"
                    checked={selectedRuleId === rule.id}
                    onChange={() => setSelectedRuleId(rule.id)}
                    style={{ cursor: 'pointer' }}
                  />
                  <YStack flex={1}>
                    <SizableText fontSize="$3" fontWeight="500" color="$color12">
                      {rule.name}
                    </SizableText>
                    {rule.description && (
                      <SizableText fontSize="$2" color="$color11" marginTop="$1">
                        {rule.description}
                      </SizableText>
                    )}
                  </YStack>
                </XStack>
              ))}
            </YStack>
          </YStack>
        )}

        {/* Selected Rule Display (if preselected) */}
        {selectedRule && preSelectedRuleId && (
          <YStack
            padding="$3"
            backgroundColor="$blue2"
            borderRadius="$4"
            borderWidth={1}
            borderColor="$blue6"
          >
            <SizableText fontSize="$3" fontWeight="500" color="$blue11">
              {selectedRule.name}
            </SizableText>
            {selectedRule.description && (
              <SizableText fontSize="$2" color="$blue10" marginTop="$1">
                {selectedRule.description}
              </SizableText>
            )}
          </YStack>
        )}

        {/* Project Context */}
        {projectName && (
          <YStack gap="$1">
            <SizableText fontSize="$2" color="$color11">
              Project
            </SizableText>
            <SizableText fontSize="$3" fontWeight="500" color="$color12">
              {projectName}
            </SizableText>
          </YStack>
        )}

        {/* Email Input */}
        <YStack gap="$2">
          <SizableText fontSize="$3" fontWeight="500" color="$color12">
            Email Address *
          </SizableText>
          <Input
            value={email}
            onChangeText={setEmail}
            placeholder="user@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            disabled={isLoading}
          />
        </YStack>

        {/* Name Input (Optional) */}
        <YStack gap="$2">
          <SizableText fontSize="$3" fontWeight="500" color="$color12">
            Name (Optional)
          </SizableText>
          <Input
            value={name}
            onChangeText={setName}
            placeholder="John Doe"
            disabled={isLoading}
          />
        </YStack>

        {/* Personal Message */}
        <YStack gap="$2">
          <SizableText fontSize="$3" fontWeight="500" color="$color12">
            Personal Message (Optional)
          </SizableText>
          <TextArea
            value={personalMessage}
            onChangeText={setPersonalMessage}
            placeholder="Add a personal note to your invitation..."
            numberOfLines={3}
            disabled={isLoading}
          />
          <SizableText fontSize="$1" color="$color10">
            This message will be included in the invitation email
          </SizableText>
        </YStack>

        {/* Info Box */}
        <YStack
          backgroundColor="$blue2"
          borderWidth={1}
          borderColor="$blue6"
          borderRadius="$4"
          padding="$3"
        >
          <SizableText fontSize="$2" color="$blue11">
            An invitation email will be sent with a unique link. If they don't have an account,
            they'll be prompted to create one when they accept.
          </SizableText>
        </YStack>

        {/* Actions */}
        <XStack gap="$3" paddingTop="$4" borderTopWidth={1} borderColor="$borderColor">
          <Button variant="outlined" onPress={handleClose} flex={1} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onPress={handleSubmit}
            flex={1}
            disabled={isLoading || !email.trim() || !selectedRuleId}
            opacity={isLoading || !email.trim() || !selectedRuleId ? 0.5 : 1}
          >
            <XStack alignItems="center" gap="$2">
              <UserPlus size={16} />
              <Text>{isLoading ? 'Sending...' : 'Send Invitation'}</Text>
            </XStack>
          </Button>
        </XStack>
      </YStack>
    </Modal>
  )
}

export default GenericInviteModal
