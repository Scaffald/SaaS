/**
 * Sent Invitations Card
 * REQ-128: Flexible Invitation System - Task 8
 *
 * Dashboard component that displays invitations sent by the current user.
 * Shows invitee info, status, and when the invitation was sent.
 */

import { Stack, Row, Text, Button, Card, H3, Spinner } from '@unicornlove/beyond-ui'
import { Mail, Send, ChevronRight, Check, X, Clock } from 'lucide-react'
import type React from 'react'
import { useNavigate } from 'react-router-dom'
import { trpc } from '../../lib/trpc'

interface SentInvitationsCardProps {
  /** Optional title override */
  title?: string
  /** Maximum number of invitations to show */
  maxVisible?: number
}

export function SentInvitationsCard({
  title = 'Sent Invitations',
  maxVisible = 5,
}: SentInvitationsCardProps) {
  const navigate = useNavigate()

  // Fetch sent invitations
  const { data: invitations, isLoading } = trpc.genericInvitations.getSent.useQuery()

  // Don't render if no invitations and not loading
  if (!isLoading && (!invitations || invitations.length === 0)) {
    return null
  }

  const visibleInvitations = invitations?.slice(0, maxVisible) || []
  const hasMore = (invitations?.length || 0) > maxVisible

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <Check size={14} color="var(--color-green10)" />
      case 'declined':
        return <X size={14} color="var(--color-red10)" />
      case 'expired':
        return <Clock size={14} color="var(--color-gray10)" />
      default:
        return <Clock size={14} color="var(--color-orange10)" />
    }
  }

  const getStatusColor = (status: string): React.CSSProperties => {
    switch (status) {
      case 'accepted':
        return { color: 'var(--color-green10)' }
      case 'declined':
        return { color: 'var(--color-red10)' }
      case 'expired':
        return { color: 'var(--color-gray10)' }
      default:
        return { color: 'var(--color-orange10)' }
    }
  }

  const getStatusBg = (status: string): React.CSSProperties => {
    switch (status) {
      case 'accepted':
        return { backgroundColor: 'var(--color-green3)' }
      case 'declined':
        return { backgroundColor: 'var(--color-red3)' }
      case 'expired':
        return { backgroundColor: 'var(--color-gray3)' }
      default:
        return { backgroundColor: 'var(--color-orange3)' }
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

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
              backgroundColor: 'var(--color-purple3)',
              borderRadius: 'var(--radius-3)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Send size={18} color="var(--color-purple10)" />
          </Stack>
          <Stack>
            <H3 style={{ fontSize: 'var(--font-size-4)', fontWeight: 600, color: 'var(--color-color12)' }}>
              {title}
            </H3>
            {invitations && invitations.length > 0 && (
              <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-color11)' }}>
                {invitations.filter((i) => i.status === 'pending').length} pending
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
      <Stack style={{ padding: 'var(--space-4)', gap: 'var(--space-2)' }}>
        {/* Loading State */}
        {isLoading && (
          <Stack style={{ alignItems: 'center', padding: 'var(--space-4)' }}>
            <Spinner size="small" color="primary" />
          </Stack>
        )}

        {/* Invitations List */}
        {visibleInvitations.map((invitation) => (
          <Row
            key={invitation.id}
            style={{
              padding: 'var(--space-3)',
              backgroundColor: 'var(--color-gray2)',
              borderRadius: 'var(--radius-3)',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Row style={{ alignItems: 'center', gap: 'var(--space-3)', flex: 1 }}>
              <Stack
                style={{
                  width: 32,
                  height: 32,
                  backgroundColor: 'var(--color-gray4)',
                  borderRadius: 'var(--radius-2)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Mail size={16} color="var(--color-gray11)" />
              </Stack>
              <Stack style={{ flex: 1 }}>
                <Text style={{ fontSize: 'var(--font-size-3)', fontWeight: 500, color: 'var(--color-color12)' }}>
                  {invitation.invitee_name || invitation.invitee_email}
                </Text>
                <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-color11)' }}>
                  {invitation.rule?.name || 'Invitation'} &bull; {formatDate(invitation.created_at)}
                </Text>
              </Stack>
            </Row>

            {/* Status Badge */}
            <Row
              style={{
                paddingLeft: 'var(--space-2)',
                paddingRight: 'var(--space-2)',
                paddingTop: 'var(--space-1)',
                paddingBottom: 'var(--space-1)',
                borderRadius: 'var(--radius-2)',
                alignItems: 'center',
                gap: 'var(--space-1)',
                ...getStatusBg(invitation.status),
              }}
            >
              {getStatusIcon(invitation.status)}
              <Text
                style={{
                  fontSize: 'var(--font-size-1)',
                  fontWeight: 500,
                  textTransform: 'capitalize',
                  ...getStatusColor(invitation.status),
                }}
              >
                {invitation.status}
              </Text>
            </Row>
          </Row>
        ))}
      </Stack>
    </Card>
  )
}

export default SentInvitationsCard
