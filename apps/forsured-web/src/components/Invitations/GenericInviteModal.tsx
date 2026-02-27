/**
 * Generic Invite Modal
 * Generic invite modal - email and manual user selection
 *
 * A universal invite modal that works with the generic invitation system.
 * Supports any invitation rule, personal messages, constraint checking,
 * and project context for project-based invitations.
 */

import { useState, useEffect } from 'react'
import { UserPlus, AlertTriangle, Check, Users } from 'lucide-react'
import { Stack, Row, Text, Button, Input, Card } from '@scaffald/ui'
import Modal from '../Common/Modal'
import { trpc } from '../../lib/trpc'
import type { InvitationRule } from '../../lib/invitations/types'
import { ManualUserBadge } from '../ManualUsers'

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

  // Manual user selection state
  type InviteMode = 'new' | 'manual'
  const [inviteMode, setInviteMode] = useState<InviteMode>('new')
  const [selectedManualUserId, setSelectedManualUserId] = useState<string | null>(null)
  const [showEmailPrompt, setShowEmailPrompt] = useState(false)
  const [promptedEmail, setPromptedEmail] = useState('')

  // Fetch available rules
  const { data: allRules } = trpc.genericInvitations.getRules.useQuery(undefined, {
    enabled: isOpen,
  })

  // Fetch manual users for selection
  const { data: manualUsersData } = trpc.manualUsers.list.useQuery(
    { limit: 100 },
    { enabled: isOpen && inviteMode === 'manual' }
  )
  const manualUsers = manualUsersData?.users || []

  // Get selected manual user details
  const selectedManualUser = selectedManualUserId
    ? manualUsers.find((u) => u.id === selectedManualUserId)
    : null

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
    // Reset manual user state
    setInviteMode('new')
    setSelectedManualUserId(null)
    setShowEmailPrompt(false)
    setPromptedEmail('')
    onClose()
  }

  // Handle manual user selection
  const handleManualUserSelect = (userId: string) => {
    const user = manualUsers.find((u) => u.id === userId)
    if (user) {
      setSelectedManualUserId(userId)
      setName(user.name || '')

      if (user.email) {
        setEmail(user.email)
        setShowEmailPrompt(false)
      } else {
        // User has no email - show prompt
        setEmail('')
        setShowEmailPrompt(true)
      }
    }
  }

  // Handle email prompt submission
  const handleEmailPromptSubmit = async () => {
    if (!promptedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(promptedEmail)) {
      setError('Please enter a valid email address')
      return
    }

    // Update manual user with the email (if API supports it)
    // For now, just use the email for the invitation
    setEmail(promptedEmail)
    setShowEmailPrompt(false)
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
                <Text
                  style={{
                    fontSize: 'var(--font-size-3)',
                    fontWeight: 500,
                    color: 'var(--color-yellow11)',
                  }}
                >
                  Relationship Constraint
                </Text>
                <Text
                  style={{
                    fontSize: 'var(--font-size-2)',
                    color: 'var(--color-yellow11)',
                    marginTop: 'var(--space-1)',
                  }}
                >
                  {constraintCheck.reason}
                </Text>
                {selectedRule?.allow_referral_only && (
                  <Text
                    style={{
                      fontSize: 'var(--font-size-2)',
                      color: 'var(--color-yellow10)',
                      marginTop: 'var(--space-2)',
                    }}
                  >
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
            <Text
              style={{
                fontSize: 'var(--font-size-3)',
                fontWeight: 500,
                color: 'var(--color-color12)',
              }}
            >
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
                    backgroundColor:
                      selectedRuleId === rule.id ? 'var(--color-blue2)' : 'transparent',
                    cursor: 'pointer',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                  }}
                  onPress={() => setSelectedRuleId(rule.id)}
                >
                  <input
                    type="radio"
                    checked={selectedRuleId === rule.id}
                    onChange={() => setSelectedRuleId(rule.id)}
                    style={{ cursor: 'pointer' }}
                  />
                  <Stack style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 'var(--font-size-3)',
                        fontWeight: 500,
                        color: 'var(--color-color12)',
                      }}
                    >
                      {rule.name}
                    </Text>
                    {rule.description && (
                      <Text
                        style={{
                          fontSize: 'var(--font-size-2)',
                          color: 'var(--color-color11)',
                          marginTop: 'var(--space-1)',
                        }}
                      >
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
            <Text
              style={{
                fontSize: 'var(--font-size-3)',
                fontWeight: 500,
                color: 'var(--color-blue11)',
              }}
            >
              {selectedRule.name}
            </Text>
            {selectedRule.description && (
              <Text
                style={{
                  fontSize: 'var(--font-size-2)',
                  color: 'var(--color-blue10)',
                  marginTop: 'var(--space-1)',
                }}
              >
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
            <Text
              style={{
                fontSize: 'var(--font-size-3)',
                fontWeight: 500,
                color: 'var(--color-color12)',
              }}
            >
              {projectName}
            </Text>
          </Stack>
        )}

        {/* Invite Mode Toggle */}
        <Stack style={{ gap: 'var(--space-2)' }}>
          <Text
            style={{
              fontSize: 'var(--font-size-3)',
              fontWeight: 500,
              color: 'var(--color-color12)',
            }}
          >
            Invite From
          </Text>
          <Row style={{ gap: 'var(--space-2)' }}>
            <button
              type="button"
              onClick={() => {
                setInviteMode('new')
                setSelectedManualUserId(null)
                setEmail('')
                setName('')
                setShowEmailPrompt(false)
              }}
              style={{
                flex: 1,
                padding: 'var(--space-3)',
                border: `1px solid ${inviteMode === 'new' ? 'var(--color-blue8)' : 'var(--color-border)'}`,
                borderRadius: 'var(--radius-3)',
                backgroundColor: inviteMode === 'new' ? 'var(--color-blue2)' : 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--space-2)',
              }}
            >
              <UserPlus
                size={16}
                color={inviteMode === 'new' ? 'var(--color-blue11)' : 'var(--color-color11)'}
              />
              <Text
                style={{
                  fontSize: 'var(--font-size-2)',
                  color: inviteMode === 'new' ? 'var(--color-blue11)' : 'var(--color-color11)',
                }}
              >
                New User
              </Text>
            </button>
            <button
              type="button"
              onClick={() => setInviteMode('manual')}
              style={{
                flex: 1,
                padding: 'var(--space-3)',
                border: `1px solid ${inviteMode === 'manual' ? 'var(--color-blue8)' : 'var(--color-border)'}`,
                borderRadius: 'var(--radius-3)',
                backgroundColor: inviteMode === 'manual' ? 'var(--color-blue2)' : 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--space-2)',
              }}
            >
              <Users
                size={16}
                color={inviteMode === 'manual' ? 'var(--color-blue11)' : 'var(--color-color11)'}
              />
              <Text
                style={{
                  fontSize: 'var(--font-size-2)',
                  color: inviteMode === 'manual' ? 'var(--color-blue11)' : 'var(--color-color11)',
                }}
              >
                Manually Added
              </Text>
            </button>
          </Row>
        </Stack>

        {/* Manual User Selection */}
        {inviteMode === 'manual' && (
          <Stack style={{ gap: 'var(--space-2)' }}>
            <Text
              style={{
                fontSize: 'var(--font-size-3)',
                fontWeight: 500,
                color: 'var(--color-color12)',
              }}
            >
              Select Manual User
            </Text>
            {manualUsers.length === 0 ? (
              <Card
                style={{
                  padding: 'var(--space-4)',
                  backgroundColor: 'var(--color-gray2)',
                  textAlign: 'center',
                }}
              >
                <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-color11)' }}>
                  No manually added users found. Create one first.
                </Text>
              </Card>
            ) : (
              <Stack style={{ gap: 'var(--space-2)', maxHeight: '200px', overflowY: 'auto' }}>
                {manualUsers.map((user) => (
                  <Row
                    key={user.id}
                    onPress={() => handleManualUserSelect(user.id)}
                    style={{
                      padding: 'var(--space-3)',
                      border: `1px solid ${selectedManualUserId === user.id ? 'var(--color-blue8)' : 'var(--color-border)'}`,
                      borderRadius: 'var(--radius-3)',
                      backgroundColor:
                        selectedManualUserId === user.id ? 'var(--color-blue2)' : 'transparent',
                      cursor: 'pointer',
                      alignItems: 'center',
                      gap: 'var(--space-3)',
                    }}
                  >
                    <input
                      type="radio"
                      checked={selectedManualUserId === user.id}
                      onChange={() => handleManualUserSelect(user.id)}
                      style={{ cursor: 'pointer' }}
                    />
                    <Stack style={{ flex: 1 }}>
                      <Row alignItems="center" style={{ gap: 'var(--space-2)' }}>
                        <Text
                          style={{
                            fontSize: 'var(--font-size-3)',
                            fontWeight: 500,
                            color: 'var(--color-color12)',
                          }}
                        >
                          {user.name}
                        </Text>
                        <ManualUserBadge size="sm" showTooltip={false} />
                      </Row>
                      {user.email ? (
                        <Text
                          style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-color11)' }}
                        >
                          {user.email}
                        </Text>
                      ) : (
                        <Text
                          style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-orange11)' }}
                        >
                          No email - will prompt to add
                        </Text>
                      )}
                    </Stack>
                  </Row>
                ))}
              </Stack>
            )}
          </Stack>
        )}

        {/* Email Prompt for manual users without email */}
        {showEmailPrompt && selectedManualUser && (
          <Card
            style={{
              padding: 'var(--space-4)',
              backgroundColor: 'var(--color-orange2)',
              border: '1px solid var(--color-orange6)',
            }}
          >
            <Stack style={{ gap: 'var(--space-3)' }}>
              <Row alignItems="flex-start" style={{ gap: 'var(--space-2)' }}>
                <AlertTriangle size={16} color="var(--color-orange11)" style={{ marginTop: 2 }} />
                <Stack style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 'var(--font-size-3)',
                      fontWeight: 500,
                      color: 'var(--color-orange11)',
                    }}
                  >
                    Email Required
                  </Text>
                  <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-orange11)' }}>
                    {selectedManualUser.name} doesn't have an email address. Please enter one to
                    send the invitation.
                  </Text>
                </Stack>
              </Row>
              <Input
                value={promptedEmail}
                onChange={(e) => setPromptedEmail(e.target.value)}
                placeholder="Enter email address"
                type="email"
              />
              <Button onPress={handleEmailPromptSubmit} variant="secondary" size="sm">
                Use This Email
              </Button>
            </Stack>
          </Card>
        )}

        {/* Email Input - only show for new user mode or when email is set */}
        {(inviteMode === 'new' || (inviteMode === 'manual' && email && !showEmailPrompt)) && (
          <Stack style={{ gap: 'var(--space-2)' }}>
            <Text
              style={{
                fontSize: 'var(--font-size-3)',
                fontWeight: 500,
                color: 'var(--color-color12)',
              }}
            >
              Email Address *
            </Text>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              type="email"
              disabled={isLoading || inviteMode === 'manual'}
            />
          </Stack>
        )}

        {/* Name Input (Optional) - only show for new user mode or when manual user selected */}
        {(inviteMode === 'new' || (inviteMode === 'manual' && selectedManualUserId)) && (
          <Stack style={{ gap: 'var(--space-2)' }}>
            <Text
              style={{
                fontSize: 'var(--font-size-3)',
                fontWeight: 500,
                color: 'var(--color-color12)',
              }}
            >
              Name {inviteMode === 'new' ? '(Optional)' : ''}
            </Text>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              disabled={isLoading || inviteMode === 'manual'}
            />
          </Stack>
        )}

        {/* Personal Message */}
        <Stack style={{ gap: 'var(--space-2)' }}>
          <Text
            style={{
              fontSize: 'var(--font-size-3)',
              fontWeight: 500,
              color: 'var(--color-color12)',
            }}
          >
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
