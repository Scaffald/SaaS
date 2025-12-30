/**
 * Pending Invitations Card
 * REQ-128: Flexible Invitation System - Task 8
 *
 * Dashboard component that displays pending invitations for the current user.
 * Shows inviter info, personal messages, and accept/decline actions.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { YStack, XStack, Text, Button, Card, H3, SizableText, Spinner } from '@unicornlove/ui'
import { Mail, UserPlus, Check, X, ChevronRight, AlertTriangle } from 'lucide-react'
import { trpc } from '../../lib/trpc'

interface PendingInvitationsCardProps {
  /** Optional title override */
  title?: string
  /** Maximum number of invitations to show */
  maxVisible?: number
  /** Callback when an invitation is accepted */
  onAccept?: () => void
  /** Callback when an invitation is declined */
  onDecline?: () => void
}

export function PendingInvitationsCard({
  title = 'Pending Invitations',
  maxVisible = 3,
  onAccept,
  onDecline,
}: PendingInvitationsCardProps) {
  const navigate = useNavigate()
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Fetch pending invitations
  const {
    data: invitations,
    isLoading,
    refetch,
  } = trpc.genericInvitations.getPending.useQuery()

  // Accept mutation
  const acceptMutation = trpc.genericInvitations.accept.useMutation({
    onSuccess: () => {
      setSuccessMessage('Invitation accepted!')
      refetch()
      onAccept?.()
      setTimeout(() => setSuccessMessage(null), 3000)
    },
    onError: (err) => {
      console.error('Failed to accept invitation:', err)
    },
    onSettled: () => {
      setProcessingId(null)
    },
  })

  // Decline mutation
  const declineMutation = trpc.genericInvitations.decline.useMutation({
    onSuccess: () => {
      setSuccessMessage('Invitation declined.')
      refetch()
      onDecline?.()
      setTimeout(() => setSuccessMessage(null), 3000)
    },
    onError: (err) => {
      console.error('Failed to decline invitation:', err)
    },
    onSettled: () => {
      setProcessingId(null)
    },
  })

  const handleAccept = (invitationId: string) => {
    setProcessingId(invitationId)
    acceptMutation.mutate({ invitationId })
  }

  const handleDecline = (invitationId: string) => {
    setProcessingId(invitationId)
    declineMutation.mutate({ invitationId })
  }

  // Don't render if no invitations and not loading
  if (!isLoading && (!invitations || invitations.length === 0)) {
    return null
  }

  const visibleInvitations = invitations?.slice(0, maxVisible) || []
  const hasMore = (invitations?.length || 0) > maxVisible

  return (
    <Card
      backgroundColor="$background"
      borderRadius="$4"
      borderWidth={1}
      borderColor="$borderColor"
    >
      {/* Header */}
      <XStack
        padding="$4"
        borderBottomWidth={1}
        borderColor="$borderColor"
        alignItems="center"
        justifyContent="space-between"
      >
        <XStack alignItems="center" gap="$3">
          <YStack
            width={36}
            height={36}
            backgroundColor="$blue3"
            borderRadius="$3"
            alignItems="center"
            justifyContent="center"
          >
            <Mail size={18} color="var(--blue10)" />
          </YStack>
          <YStack>
            <H3 fontSize="$4" fontWeight="600" color="$color12">
              {title}
            </H3>
            {invitations && invitations.length > 0 && (
              <Text fontSize="$2" color="$color11">
                {invitations.length} pending
              </Text>
            )}
          </YStack>
        </XStack>
        {hasMore && (
          <Button
            size="$2"
            variant="outlined"
            onPress={() => navigate('/notifications')}
          >
            <XStack alignItems="center" gap="$1">
              <Text fontSize="$2">View All</Text>
              <ChevronRight size={14} />
            </XStack>
          </Button>
        )}
      </XStack>

      {/* Content */}
      <YStack padding="$4" gap="$3">
        {/* Success Message */}
        {successMessage && (
          <YStack
            backgroundColor="$green2"
            borderWidth={1}
            borderColor="$green6"
            borderRadius="$3"
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

        {/* Loading State */}
        {isLoading && (
          <YStack alignItems="center" padding="$4">
            <Spinner size="small" color="$blue10" />
          </YStack>
        )}

        {/* Invitations List */}
        {visibleInvitations.map((invitation) => (
          <YStack
            key={invitation.id}
            padding="$4"
            backgroundColor="$gray2"
            borderRadius="$4"
            borderWidth={1}
            borderColor="$gray4"
            gap="$3"
          >
            {/* Invitation Header */}
            <XStack alignItems="flex-start" justifyContent="space-between">
              <YStack flex={1}>
                <XStack alignItems="center" gap="$2">
                  <UserPlus size={16} color="var(--blue10)" />
                  <SizableText fontSize="$3" fontWeight="600" color="$color12">
                    {invitation.rule?.name || 'Invitation'}
                  </SizableText>
                </XStack>
                {invitation.inviter?.full_name && (
                  <SizableText fontSize="$2" color="$color11" marginTop="$1">
                    From {invitation.inviter.full_name}
                  </SizableText>
                )}
              </YStack>
            </XStack>

            {/* Personal Message */}
            {invitation.personal_message && (
              <YStack
                backgroundColor="$blue2"
                borderRadius="$3"
                padding="$3"
                borderLeftWidth={3}
                borderColor="$blue8"
              >
                <SizableText fontSize="$2" fontStyle="italic" color="$color12">
                  "{invitation.personal_message}"
                </SizableText>
              </YStack>
            )}

            {/* Constraint Warning */}
            {invitation.constraint_blocked && (
              <XStack
                backgroundColor="$yellow2"
                borderRadius="$3"
                padding="$3"
                alignItems="center"
                gap="$2"
              >
                <AlertTriangle size={14} color="var(--yellow11)" />
                <SizableText fontSize="$2" color="$yellow11" flex={1}>
                  {invitation.constraint_reason || 'Relationship constraint applies'}
                </SizableText>
              </XStack>
            )}

            {/* Action Buttons */}
            <XStack gap="$2">
              <Button
                flex={1}
                size="$3"
                variant="outlined"
                onPress={() => handleDecline(invitation.id)}
                disabled={processingId === invitation.id}
              >
                <XStack alignItems="center" gap="$1">
                  <X size={14} />
                  <Text fontSize="$2">Decline</Text>
                </XStack>
              </Button>
              <Button
                flex={1}
                size="$3"
                onPress={() => handleAccept(invitation.id)}
                disabled={processingId === invitation.id}
              >
                <XStack alignItems="center" gap="$1">
                  {processingId === invitation.id ? (
                    <Spinner size="small" />
                  ) : (
                    <Check size={14} />
                  )}
                  <Text fontSize="$2">Accept</Text>
                </XStack>
              </Button>
            </XStack>
          </YStack>
        ))}
      </YStack>
    </Card>
  )
}

export default PendingInvitationsCard
