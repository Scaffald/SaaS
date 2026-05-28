import { ROUTES } from '@scf/core/constants/routes'
import { useMyTeamInvitations, useRespondToTeamInvitation } from '@scaffald/sdk/react'
import type { TeamInvitation } from '@scaffald/sdk'
import { CheckCircle, Clock, XCircle } from 'lucide-react-native'
import { useToast } from '@scaffald/ui'
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { Button, Card, DashboardWidget, DashboardWidgetHeader, Separator, Skeleton, SkeletonBox, SkeletonText, Text, Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors, glassVibrantColors } from '@scaffald/ui/tokens'

function TeamInvitationsWidgetSkeleton() {
  return (
    <Card variant="outlined" padding="md" style={{ gap: 16 }}>
      {/* Header */}
      <Row justify="space-between" align="center">
        <Row gap={8} align="center">
          <Skeleton width={24} height={24} shape="circle" />
          <Skeleton width={140} height={16} shape="text" />
        </Row>
        <SkeletonBox width={72} height={32} borderRadius={8} />
      </Row>

      {/* Invitation skeletons */}
      {[0, 1].map((i) => (
        <Card key={i} variant="outlined" padding="md" style={{ gap: 12 }}>
          <Row justify="space-between" align="center">
            <SkeletonText lines={2} style={{ flex: 1 }} />
            <Row gap={8} marginLeft={16}>
              <SkeletonBox width={80} height={32} borderRadius={8} />
              <SkeletonBox width={80} height={32} borderRadius={8} />
            </Row>
          </Row>
        </Card>
      ))}
    </Card>
  )
}

type InvitationRecord = TeamInvitation

interface TeamInvitationListProps {
  invitations: InvitationRecord[]
  onRespond: (invitationId: string, action: 'accept' | 'decline') => Promise<void>
  isProcessing?: boolean
  showEmptyStateDescription?: boolean
}

export function TeamInvitationList({
  invitations,
  onRespond,
  isProcessing = false,
  showEmptyStateDescription = true,
}: TeamInvitationListProps) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const [pendingId, setPendingId] = useState<string | null>(null)

  if (!invitations.length) {
    return (
      <Stack
        gap={8}
        style={{ borderWidth: 1, borderColor: glassVibrantColors[t].separator, borderRadius: 20, backgroundColor: glassVibrantColors[t].tertiaryFill }}
        padding="md"
      >
        <Text>No pending invitations</Text>
        {showEmptyStateDescription ? (
          <Text style={{ color: colors.text[t].secondary }}>
            You&apos;re all caught up. New invitations will appear here for quick review.
          </Text>
        ) : null}
      </Stack>
    )
  }

  return (
    <Stack gap={12}>
      {invitations.map((invitation) => {
        const teamName = invitation.team?.name ?? 'Team'
        const organizationName = invitation.team?.organizationName ?? 'Organization'
        const sentAt = invitation.sentAt ? new Date(invitation.sentAt).toLocaleString() : null
        const expiresAt = invitation.expiresAt
          ? new Date(invitation.expiresAt).toLocaleDateString()
          : null

        const isPending = pendingId === invitation.id

        return (
          <Card
            key={invitation.id}
            variant="outlined"
            padding="md"
            style={{ gap: 12 }}
          >
            <Row justify="space-between" align="center">
              <Stack gap={4} flex={1}>
                <Text>{teamName}</Text>
                <Text style={{ color: colors.text[t].secondary }}>{organizationName}</Text>
                <Row gap={8} align="center" marginTop={8}>
                  <Clock size={20} color={colors.text[t].tertiary} />
                  <Text style={{ color: colors.text[t].secondary }}>
                    Sent {sentAt ?? 'recently'}
                    {expiresAt ? ` · Expires ${expiresAt}` : null}
                  </Text>
                </Row>
              </Stack>
              <Row gap={8} marginLeft={16} flexShrink={0} wrap justify="flex-end">
                <Button
                  size="sm"
                  iconStart={XCircle}
                  variant="outline"
                  color="error"
                  disabled={isProcessing}
                  onPress={async () => {
                    setPendingId(invitation.id)
                    try {
                      await onRespond(invitation.id, 'decline')
                    } finally {
                      setPendingId(null)
                    }
                  }}
                >
                  Decline
                </Button>
                <Button
                  size="sm"
                  iconStart={CheckCircle}
                  color="gray"
                  variant="outline"
                  disabled={isProcessing}
                  onPress={async () => {
                    setPendingId(invitation.id)
                    try {
                      await onRespond(invitation.id, 'accept')
                    } finally {
                      setPendingId(null)
                    }
                  }}
                  loading={isPending}
                >
                  Accept
                </Button>
              </Row>
            </Row>
          </Card>
        )
      })}
    </Stack>
  )
}

export function TeamInvitationsWidget() {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const router = useRouter()
  const toast = useToast()

  const invitationsQuery = useMyTeamInvitations(
    { status: 'pending' },
    {
      staleTime: 30_000,
    }
  )

  const respondMutation = useRespondToTeamInvitation({
    onSuccess: (result) => {
      const invitation = result.invitation
      toast.show({
        title: invitation.status === 'accepted' ? 'Invitation accepted' : 'Invitation declined',
        message:
          invitation.status === 'accepted'
            ? 'You now have access to the team.'
            : 'You can accept again later if you change your mind.',
        variant: invitation.status === 'accepted' ? 'success' : 'info',
      })
      void invitationsQuery.refetch()
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unable to respond to invitation'
      toast.show({
        title: 'Unable to respond',
        message,
        variant: 'error',
      })
    },
  })

  const invitations = useMemo(
    () => (invitationsQuery.data?.invitations ?? []) as InvitationRecord[],
    [invitationsQuery.data?.invitations]
  )

  const topInvitations = invitations.slice(0, 3)
  const remainingCount = Math.max(invitations.length - topInvitations.length, 0)

  if (invitationsQuery.isLoading) {
    return <TeamInvitationsWidgetSkeleton />
  }

  if (invitations.length === 0) {
    return null
  }

  const handleRespond = async (invitationId: string, action: 'accept' | 'decline') => {
    await respondMutation.mutateAsync({
      invitationId,
      params: { action },
    })
  }

  return (
    <DashboardWidget gap={16}>
      <DashboardWidgetHeader
        title="Team invitations"
        action={
          <Button
            variant="outline"
            size="sm"
            onPress={() => router.push(ROUTES.EMPLOYERS.TEAMS.INVITATIONS.path)}
          >
            Manage
          </Button>
        }
      />

      <TeamInvitationList
        invitations={topInvitations}
        onRespond={handleRespond}
        isProcessing={respondMutation.isPending}
        showEmptyStateDescription={false}
      />
      {remainingCount > 0 ? (
        <>
          <Separator />
          <Text style={{ color: colors.text[t].secondary }}>
            {remainingCount} more invitation{remainingCount === 1 ? '' : 's'} waiting in your
            inbox.
          </Text>
        </>
      ) : null}
    </DashboardWidget>
  )
}
