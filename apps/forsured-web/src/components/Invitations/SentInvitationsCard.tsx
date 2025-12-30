/**
 * Sent Invitations Card
 * REQ-128: Flexible Invitation System - Task 8
 *
 * Dashboard component that displays invitations sent by the current user.
 * Shows invitee info, status, and when the invitation was sent.
 */

import { YStack, XStack, Text, Button, Card, H3, SizableText, Spinner } from '@unicornlove/ui'
import { Mail, Send, ChevronRight, Check, X, Clock } from 'lucide-react'
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
        return <Check size={14} color="var(--green10)" />
      case 'declined':
        return <X size={14} color="var(--red10)" />
      case 'expired':
        return <Clock size={14} color="var(--gray10)" />
      default:
        return <Clock size={14} color="var(--orange10)" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return '$green10' as const
      case 'declined':
        return '$red10' as const
      case 'expired':
        return '$gray10' as const
      default:
        return '$orange10' as const
    }
  }

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'accepted':
        return '$green3' as const
      case 'declined':
        return '$red3' as const
      case 'expired':
        return '$gray3' as const
      default:
        return '$orange3' as const
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
            backgroundColor="$purple3"
            borderRadius="$3"
            alignItems="center"
            justifyContent="center"
          >
            <Send size={18} color="var(--purple10)" />
          </YStack>
          <YStack>
            <H3 fontSize="$4" fontWeight="600" color="$color12">
              {title}
            </H3>
            {invitations && invitations.length > 0 && (
              <Text fontSize="$2" color="$color11">
                {invitations.filter((i) => i.status === 'pending').length} pending
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
      <YStack padding="$4" gap="$2">
        {/* Loading State */}
        {isLoading && (
          <YStack alignItems="center" padding="$4">
            <Spinner size="small" color="$blue10" />
          </YStack>
        )}

        {/* Invitations List */}
        {visibleInvitations.map((invitation) => (
          <XStack
            key={invitation.id}
            padding="$3"
            backgroundColor="$gray2"
            borderRadius="$3"
            alignItems="center"
            justifyContent="space-between"
          >
            <XStack alignItems="center" gap="$3" flex={1}>
              <YStack
                width={32}
                height={32}
                backgroundColor="$gray4"
                borderRadius="$2"
                alignItems="center"
                justifyContent="center"
              >
                <Mail size={16} color="var(--gray11)" />
              </YStack>
              <YStack flex={1}>
                <SizableText fontSize="$3" fontWeight="500" color="$color12">
                  {invitation.invitee_name || invitation.invitee_email}
                </SizableText>
                <SizableText fontSize="$2" color="$color11">
                  {invitation.rule?.name || 'Invitation'} • {formatDate(invitation.created_at)}
                </SizableText>
              </YStack>
            </XStack>

            {/* Status Badge */}
            <XStack
              paddingHorizontal="$2"
              paddingVertical="$1"
              backgroundColor={getStatusBg(invitation.status)}
              borderRadius="$2"
              alignItems="center"
              gap="$1"
            >
              {getStatusIcon(invitation.status)}
              <SizableText
                fontSize="$1"
                fontWeight="500"
                textTransform="capitalize"
                color={getStatusColor(invitation.status)}
              >
                {invitation.status}
              </SizableText>
            </XStack>
          </XStack>
        ))}
      </YStack>
    </Card>
  )
}

export default SentInvitationsCard
