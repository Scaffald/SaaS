/**
 * Broker Invitation Input Component
 * REQ-126: Broker Invitation System
 * REQ-11: Rate limiting and brokerage name display
 *
 * Handles broker invitation code input and validation
 */
import { useState } from 'react'
import { YStack, XStack, Text, Spinner } from '@unicornlove/ui'
import { Button as CoreButton } from '@unicornlove/ui'
import { Input as TextInput } from '@unicornlove/ui'
import { Shield } from 'lucide-react'
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
      <YStack
        borderTopWidth={1}
        borderTopColor="$borderColor"
        paddingTop="$6"
        alignItems="center"
        gap="$2"
      >
        <Text color="$color10">Are you an insurance broker?</Text>
        <CoreButton
          onClick={() => setShowInvitation(true)}
          data-testid="broker-invitation-link"
          variant="ghost"
        >
          Enter Invitation Code
        </CoreButton>
      </YStack>
    )
  }

  return (
    <YStack borderTopWidth={1} borderTopColor="$borderColor" paddingTop="$6">
      <YStack
        backgroundColor="$background"
        borderRadius="$3"
        shadowColor="$shadowColor"
        shadowRadius={4}
        shadowOffset={{ width: 0, height: 2 }}
        padding="$6"
        gap="$4"
      >
        <XStack alignItems="center" gap="$2" mb="$4">
          <Shield size={24} color="currentColor" />
          <Text fontSize="$5" fontWeight="600" color="$color12">
            Broker Invitation
          </Text>
        </XStack>

        <Text fontSize="$2" color="$color10" mb="$4">
          Enter your invitation code to join as an insurance broker.
        </Text>

        {/* Show brokerage name if validated */}
        {validatedInvitation?.brokerage_name && (
          <YStack
            backgroundColor="$green2"
            borderWidth={1}
            borderColor="$green6"
            borderRadius="$3"
            padding="$3"
            mb="$2"
          >
            <Text fontSize="$2" color="$green11">
              Invitation from: <Text fontWeight="600">{validatedInvitation.brokerage_name}</Text>
            </Text>
          </YStack>
        )}

        {/* Show validation error */}
        {validationError && (
          <YStack
            backgroundColor="$red2"
            borderWidth={1}
            borderColor="$red6"
            borderRadius="$3"
            padding="$3"
            mb="$2"
          >
            <Text fontSize="$2" color="$red11">
              {validationError.message}
            </Text>
            {validationError.retryAfter && (
              <Text fontSize="$1" color="$red10" mt="$1">
                Please try again in {Math.ceil(validationError.retryAfter / 60)} minute(s).
              </Text>
            )}
          </YStack>
        )}

        <YStack gap="$4">
          <TextInput
            type="text"
            value={invitationCode}
            onChange={(e) => setInvitationCode(e.target.value.toUpperCase())}
            placeholder="Enter code (e.g., ABCD1234)"
            maxLength={20}
            data-testid="invitation-code-input"
          />
          <XStack gap="$3">
            <CoreButton
              onClick={handleVerify}
              disabled={isLoading || invitationCode.length < 4}
              data-testid="verify-invitation-button"
              variant="primary"
              flex={1}
            >
              {isLoading ? (
                <XStack gap="$2" alignItems="center">
                  <Spinner size="small" color="$color1" />
                  <Text>Verifying...</Text>
                </XStack>
              ) : (
                'Verify & Continue'
              )}
            </CoreButton>
            <CoreButton
              onClick={handleCancel}
              data-testid="cancel-invitation-button"
              variant="ghost"
            >
              Cancel
            </CoreButton>
          </XStack>
        </YStack>
      </YStack>
    </YStack>
  )
}
