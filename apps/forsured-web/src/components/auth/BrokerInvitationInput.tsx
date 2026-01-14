/**
 * Broker Invitation Input Component
 * REQ-126: Broker Invitation System
 * REQ-11: Rate limiting and brokerage name display
 *
 * Handles broker invitation code input and validation
 */
import { useState } from 'react'
import { Stack, Row, Text, Button, Input } from '@unicornlove/beyond-ui'
import { Shield, Loader2 } from 'lucide-react'
import {
  validateInvitationWithRateLimit,
  type Invitation,
  type InvitationError,
} from '../../lib/invitations'

export interface BrokerInvitationInputProps {
  userEmail?: string
  onValidCode: (invitation: Invitation) => void
  onError: (error: string) => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

export function BrokerInvitationInput({
  userEmail,
  onValidCode,
  onError,
  isLoading,
  setIsLoading,
}: BrokerInvitationInputProps) {
  const [showInvitation, setShowInvitation] = useState(false)
  const [invitationCode, setInvitationCode] = useState('')
  const [validationError, setValidationError] = useState<InvitationError | null>(null)
  const [validatedInvitation, setValidatedInvitation] = useState<Invitation | null>(null)

  async function handleVerify() {
    setIsLoading(true)
    setValidationError(null)

    const result = await validateInvitationWithRateLimit(invitationCode, userEmail)

    if (!result.success) {
      setValidationError(result.error ?? null)
      onError(result.error?.message ?? 'Validation failed')
      setIsLoading(false)
      return
    }

    if (result.invitation) {
      setValidatedInvitation(result.invitation)
      onValidCode(result.invitation)
    }
    setIsLoading(false)
  }

  function handleCancel() {
    setShowInvitation(false)
    setInvitationCode('')
    setValidationError(null)
    setValidatedInvitation(null)
    onError('') // Clear any parent errors
  }

  if (!showInvitation) {
    return (
      <Stack
        style={{
          borderTopWidth: '1px',
          borderTopStyle: 'solid',
          borderTopColor: 'var(--color-border)',
          paddingTop: '24px',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <Text style={{ color: 'var(--color-color10)' }}>Are you an insurance broker?</Text>
        <Button
          onClick={() => setShowInvitation(true)}
          data-testid="broker-invitation-link"
          variant="ghost"
        >
          Enter Invitation Code
        </Button>
      </Stack>
    )
  }

  return (
    <Stack
      style={{
        borderTopWidth: '1px',
        borderTopStyle: 'solid',
        borderTopColor: 'var(--color-border)',
        paddingTop: '24px',
      }}
    >
      <Stack
        style={{
          backgroundColor: 'var(--color-background)',
          borderRadius: '8px',
          boxShadow: '0 2px 4px var(--color-shadow)',
          padding: '24px',
          gap: '16px',
        }}
      >
        <Row style={{ alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Shield size={24} color="currentColor" />
          <Text style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-color12)' }}>
            Broker Invitation
          </Text>
        </Row>

        <Text style={{ fontSize: '12px', color: 'var(--color-color10)', marginBottom: '16px' }}>
          Enter your invitation code to join as an insurance broker.
        </Text>

        {/* Show brokerage name if validated */}
        {validatedInvitation?.brokerage_name && (
          <Stack
            style={{
              backgroundColor: 'var(--color-green2)',
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: 'var(--color-green6)',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '8px',
            }}
          >
            <Text style={{ fontSize: '12px', color: 'var(--color-green11)' }}>
              Invitation from: <Text style={{ fontWeight: 600 }}>{validatedInvitation.brokerage_name}</Text>
            </Text>
          </Stack>
        )}

        {/* Show validation error */}
        {validationError && (
          <Stack
            style={{
              backgroundColor: 'var(--color-red2)',
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: 'var(--color-red6)',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '8px',
            }}
          >
            <Text style={{ fontSize: '12px', color: 'var(--color-red11)' }}>
              {validationError.message}
            </Text>
            {validationError.retryAfter && (
              <Text style={{ fontSize: '10px', color: 'var(--color-red10)', marginTop: '4px' }}>
                Please try again in {Math.ceil(validationError.retryAfter / 60)} minute(s).
              </Text>
            )}
          </Stack>
        )}

        <Stack style={{ gap: '16px' }}>
          <Input
            type="text"
            value={invitationCode}
            onChange={(e) => setInvitationCode(e.target.value.toUpperCase())}
            placeholder="Enter code (e.g., ABCD1234)"
            maxLength={20}
            data-testid="invitation-code-input"
          />
          <Row style={{ gap: '12px' }}>
            <Button
              onClick={handleVerify}
              disabled={isLoading || invitationCode.length < 4}
              data-testid="verify-invitation-button"
              variant="primary"
              style={{ flex: 1 }}
            >
              {isLoading ? (
                <Row style={{ gap: '8px', alignItems: 'center' }}>
                  <Loader2 className="animate-spin" size={16} color="var(--color-color1)" />
                  <Text>Verifying...</Text>
                </Row>
              ) : (
                'Verify & Continue'
              )}
            </Button>
            <Button
              onClick={handleCancel}
              data-testid="cancel-invitation-button"
              variant="ghost"
            >
              Cancel
            </Button>
          </Row>
        </Stack>
      </Stack>
    </Stack>
  )
}
