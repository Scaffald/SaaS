/**
 * Pending Invitations Card
 * Flexible Invitation System - Task 8
 *
 * Dashboard component that displays pending invitations for the current user.
 * Shows inviter info, personal messages, and accept/decline actions.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Stack, Row, Text, Button, Card, H3, Spinner } from '@scaffald/ui'
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
      style={{
        backgroundColor: 'var(--color-background)',
        borderRadius: 'var(--radius-4)',
        border: '1px solid var(--color-border)',
      }}
    >
      {/* Header */}
      <Row
        style={{
          padding: 'var(--space-4)',
          borderBottom: '1px solid var(--color-border)',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Row style={{ alignItems: 'center', gap: 'var(--space-3)' }}>
          <Stack
            style={{
              width: 36,
              height: 36,
              backgroundColor: 'var(--color-blue3)',
              borderRadius: 'var(--radius-3)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Mail size={18} color="var(--color-blue10)" />
          </Stack>
          <Stack>
            <H3 style={{ fontSize: 'var(--font-size-4)', fontWeight: 600, color: 'var(--color-color12)' }}>
              {title}
            </H3>
            {invitations && invitations.length > 0 && (
              <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-color11)' }}>
                {invitations.length} pending
              </Text>
            )}
          </Stack>
        </Row>
        {hasMore && (
          <Button
            size="small"
            variant="outline"
            onPress={() => navigate('/notifications')}
          >
            <Row style={{ alignItems: 'center', gap: 'var(--space-1)' }}>
              <Text style={{ fontSize: 'var(--font-size-2)' }}>View All</Text>
              <ChevronRight size={14} />
            </Row>
          </Button>
        )}
      </Row>

      {/* Content */}
      <Stack style={{ padding: 'var(--space-4)', gap: 'var(--space-3)' }}>
        {/* Success Message */}
        {successMessage && (
          <Stack
            style={{
              backgroundColor: 'var(--color-green2)',
              border: '1px solid var(--color-green6)',
              borderRadius: 'var(--radius-3)',
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

        {/* Loading State */}
        {isLoading && (
          <Stack style={{ alignItems: 'center', padding: 'var(--space-4)' }}>
            <Spinner size="small" color="primary" />
          </Stack>
        )}

        {/* Invitations List */}
        {visibleInvitations.map((invitation) => (
          <Stack
            key={invitation.id}
            style={{
              padding: 'var(--space-4)',
              backgroundColor: 'var(--color-gray2)',
              borderRadius: 'var(--radius-4)',
              border: '1px solid var(--color-gray4)',
              gap: 'var(--space-3)',
            }}
          >
            {/* Invitation Header */}
            <Row style={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <Stack style={{ flex: 1 }}>
                <Row style={{ alignItems: 'center', gap: 'var(--space-2)' }}>
                  <UserPlus size={16} color="var(--color-blue10)" />
                  <Text style={{ fontSize: 'var(--font-size-3)', fontWeight: 600, color: 'var(--color-color12)' }}>
                    {invitation.rule?.name || 'Invitation'}
                  </Text>
                </Row>
                {invitation.inviter?.full_name && (
                  <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-color11)', marginTop: 'var(--space-1)' }}>
                    From {invitation.inviter.full_name}
                  </Text>
                )}
              </Stack>
            </Row>

            {/* Personal Message */}
            {invitation.personal_message && (
              <Stack
                style={{
                  backgroundColor: 'var(--color-blue2)',
                  borderRadius: 'var(--radius-3)',
                  padding: 'var(--space-3)',
                  borderLeft: '3px solid var(--color-blue8)',
                }}
              >
                <Text style={{ fontSize: 'var(--font-size-2)', fontStyle: 'italic', color: 'var(--color-color12)' }}>
                  "{invitation.personal_message}"
                </Text>
              </Stack>
            )}

            {/* Constraint Warning */}
            {invitation.constraint_blocked && (
              <Row
                style={{
                  backgroundColor: 'var(--color-yellow2)',
                  borderRadius: 'var(--radius-3)',
                  padding: 'var(--space-3)',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                }}
              >
                <AlertTriangle size={14} color="var(--color-yellow11)" />
                <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-yellow11)', flex: 1 }}>
                  {invitation.constraint_reason || 'Relationship constraint applies'}
                </Text>
              </Row>
            )}

            {/* Action Buttons */}
            <Row style={{ gap: 'var(--space-2)' }}>
              <Button
                style={{ flex: 1 }}
                size="medium"
                variant="outline"
                onPress={() => handleDecline(invitation.id)}
                disabled={processingId === invitation.id}
              >
                <Row style={{ alignItems: 'center', gap: 'var(--space-1)' }}>
                  <X size={14} />
                  <Text style={{ fontSize: 'var(--font-size-2)' }}>Decline</Text>
                </Row>
              </Button>
              <Button
                style={{ flex: 1 }}
                size="medium"
                onPress={() => handleAccept(invitation.id)}
                disabled={processingId === invitation.id}
              >
                <Row style={{ alignItems: 'center', gap: 'var(--space-1)' }}>
                  {processingId === invitation.id ? (
                    <Spinner size="small" />
                  ) : (
                    <Check size={14} />
                  )}
                  <Text style={{ fontSize: 'var(--font-size-2)' }}>Accept</Text>
                </Row>
              </Button>
            </Row>
          </Stack>
        ))}
      </Stack>
    </Card>
  )
}

export default PendingInvitationsCard
