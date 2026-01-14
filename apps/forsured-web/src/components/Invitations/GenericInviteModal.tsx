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
import { Stack, Row, Text, Button, Input } from '@unicornlove/beyond-ui'
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
      <Stack style={{ gap: 'var(--space-4)' }}>
        {/* Success Message */}
        {successMessage && (
          <Stack
            style={{
              backgroundColor: 'var(--color-green2)',
              border: '1px solid var(--color-green6)',
              borderRadius: 'var(--radius-4)',
              padding: 'var(--space-3)',
            }}
          >
            <Row style={{ alignItems: 'center', gap: 'var(--space-2)' }}>
              <Check size={16} color="var(--color-green11)" />
              <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-green11)' }}>
                {successMessage}
              </Text>
            </Row>
          </Stack>
        )}

        {/* Error Message */}
        {error && (
          <Stack
            style={{
              backgroundColor: 'var(--color-red2)',
              border: '1px solid var(--color-red6)',
              borderRadius: 'var(--radius-4)',
              padding: 'var(--space-3)',
            }}
          >
            <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-red11)' }}>
              {error}
            </Text>
          </Stack>
        )}

        {/* Constraint Warning */}
        {constraintCheck && !constraintCheck.allowed && (
          <Stack
            style={{
              backgroundColor: 'var(--color-yellow2)',
              border: '1px solid var(--color-yellow6)',
              borderRadius: 'var(--radius-4)',
              padding: 'var(--space-3)',
            }}
          >
            <Row style={{ alignItems: 'flex-start', gap: 'var(--space-2)' }}>
              <AlertTriangle size={16} color="var(--color-yellow11)" style={{ marginTop: 2 }} />
              <Stack style={{ flex: 1 }}>
                <Text style={{ fontSize: 'var(--font-size-3)', fontWeight: 500, color: 'var(--color-yellow11)' }}>
                  Relationship Constraint
                </Text>
                <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-yellow11)', marginTop: 'var(--space-1)' }}>
                  {constraintCheck.reason}
                </Text>
                {selectedRule?.allow_referral_only && (
                  <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-yellow10)', marginTop: 'var(--space-2)' }}>
                    The invitation will still be sent, but no relationship will be created.
                  </Text>
                )}
              </Stack>
            </Row>
          </Stack>
        )}

        {/* Rule Selection (if multiple rules available) */}
        {availableRules.length > 1 && !preSelectedRuleId && (
          <Stack style={{ gap: 'var(--space-2)' }}>
            <Text style={{ fontSize: 'var(--font-size-3)', fontWeight: 500, color: 'var(--color-color12)' }}>
              Invitation Type
            </Text>
            <Stack style={{ gap: 'var(--space-2)' }}>
              {availableRules.map((rule) => (
                <Row
                  key={rule.id}
                  style={{
                    padding: 'var(--space-3)',
                    border: `1px solid ${selectedRuleId === rule.id ? 'var(--color-blue8)' : 'var(--color-border)'}`,
                    borderRadius: 'var(--radius-4)',
                    backgroundColor: selectedRuleId === rule.id ? 'var(--color-blue2)' : 'transparent',
                    cursor: 'pointer',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                  }}
                  onClick={() => setSelectedRuleId(rule.id)}
                >
                  <input
                    type="radio"
                    checked={selectedRuleId === rule.id}
                    onChange={() => setSelectedRuleId(rule.id)}
                    style={{ cursor: 'pointer' }}
                  />
                  <Stack style={{ flex: 1 }}>
                    <Text style={{ fontSize: 'var(--font-size-3)', fontWeight: 500, color: 'var(--color-color12)' }}>
                      {rule.name}
                    </Text>
                    {rule.description && (
                      <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-color11)', marginTop: 'var(--space-1)' }}>
                        {rule.description}
                      </Text>
                    )}
                  </Stack>
                </Row>
              ))}
            </Stack>
          </Stack>
        )}

        {/* Selected Rule Display (if preselected) */}
        {selectedRule && preSelectedRuleId && (
          <Stack
            style={{
              padding: 'var(--space-3)',
              backgroundColor: 'var(--color-blue2)',
              borderRadius: 'var(--radius-4)',
              border: '1px solid var(--color-blue6)',
            }}
          >
            <Text style={{ fontSize: 'var(--font-size-3)', fontWeight: 500, color: 'var(--color-blue11)' }}>
              {selectedRule.name}
            </Text>
            {selectedRule.description && (
              <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-blue10)', marginTop: 'var(--space-1)' }}>
                {selectedRule.description}
              </Text>
            )}
          </Stack>
        )}

        {/* Project Context */}
        {projectName && (
          <Stack style={{ gap: 'var(--space-1)' }}>
            <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-color11)' }}>
              Project
            </Text>
            <Text style={{ fontSize: 'var(--font-size-3)', fontWeight: 500, color: 'var(--color-color12)' }}>
              {projectName}
            </Text>
          </Stack>
        )}

        {/* Email Input */}
        <Stack style={{ gap: 'var(--space-2)' }}>
          <Text style={{ fontSize: 'var(--font-size-3)', fontWeight: 500, color: 'var(--color-color12)' }}>
            Email Address *
          </Text>
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
            type="email"
            disabled={isLoading}
          />
        </Stack>

        {/* Name Input (Optional) */}
        <Stack style={{ gap: 'var(--space-2)' }}>
          <Text style={{ fontSize: 'var(--font-size-3)', fontWeight: 500, color: 'var(--color-color12)' }}>
            Name (Optional)
          </Text>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            disabled={isLoading}
          />
        </Stack>

        {/* Personal Message */}
        <Stack style={{ gap: 'var(--space-2)' }}>
          <Text style={{ fontSize: 'var(--font-size-3)', fontWeight: 500, color: 'var(--color-color12)' }}>
            Personal Message (Optional)
          </Text>
          <textarea
            value={personalMessage}
            onChange={(e) => setPersonalMessage(e.target.value)}
            placeholder="Add a personal note to your invitation..."
            rows={3}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-3)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-background)',
              color: 'var(--color-color12)',
              fontSize: 'var(--font-size-3)',
              fontFamily: 'inherit',
              resize: 'vertical',
            }}
          />
          <Text style={{ fontSize: 'var(--font-size-1)', color: 'var(--color-color10)' }}>
            This message will be included in the invitation email
          </Text>
        </Stack>

        {/* Info Box */}
        <Stack
          style={{
            backgroundColor: 'var(--color-blue2)',
            border: '1px solid var(--color-blue6)',
            borderRadius: 'var(--radius-4)',
            padding: 'var(--space-3)',
          }}
        >
          <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-blue11)' }}>
            An invitation email will be sent with a unique link. If they don't have an account,
            they'll be prompted to create one when they accept.
          </Text>
        </Stack>

        {/* Actions */}
        <Row
          style={{
            gap: 'var(--space-3)',
            paddingTop: 'var(--space-4)',
            borderTop: '1px solid var(--color-border)',
          }}
        >
          <Button variant="outline" onPress={handleClose} style={{ flex: 1 }} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onPress={handleSubmit}
            style={{
              flex: 1,
              opacity: isLoading || !email.trim() || !selectedRuleId ? 0.5 : 1,
            }}
            disabled={isLoading || !email.trim() || !selectedRuleId}
          >
            <Row style={{ alignItems: 'center', gap: 'var(--space-2)' }}>
              <UserPlus size={16} />
              <Text>{isLoading ? 'Sending...' : 'Send Invitation'}</Text>
            </Row>
          </Button>
        </Row>
      </Stack>
    </Modal>
  )
}

export default GenericInviteModal
