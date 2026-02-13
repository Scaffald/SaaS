import { ROUTES } from '@scf/core/constants/routes'
import { useMyTeamInvitations, useRespondToTeamInvitation } from '@scaffald/sdk/react'
import type { TeamInvitation } from '@scaffald/sdk'
import { CheckCircle, Clock, Users, XCircle } from 'lucide-react-native'
import { useToast } from '@unicornlove/beyond-ui'
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { Button, Card, Separator, Spinner, Text, Row, Stack } from '@unicornlove/beyond-ui'

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
  const [pendingId, setPendingId] = useState<string | null>(null)

  if (!invitations.length) {
    return (
      <Stack
        gap={8}
        borderWidth={1}
        borderColor="$borderColor"
        borderRadius={16}
        padding="md"
        backgroundColor="$color2"
      >
        <Text>No pending invitations</Text>
        {showEmptyStateDescription ? (
          <Text color="$gray11">
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
            padding="md"
            borderWidth={1}
            borderColor="$borderColor"
            gap={12}
            backgroundColor="$color1"
          >
            <Row justify="space-between" align="center">
              <Stack gap={4} flex={1}>
                <Text>{teamName}</Text>
                <Text color="$gray11">{organizationName}</Text>
                <Row gap={8} align="center" marginTop={8}>
                  <Clock size="md" color="$gray11" />
                  <Text color="$gray11">
                    Sent {sentAt ?? 'recently'}
                    {expiresAt ? ` · Expires ${expiresAt}` : null}
                  </Text>
                </Row>
              </Stack>
              <Row gap={8} marginLeft={16} flexShrink={0} flexWrap="wrap" justify="flex-end">
                <Button
                  size="xs"
                  iconStart={XCircle}
                  variant="outline"
                  color="$red10"
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
                  size="xs"
                  iconStart={CheckCircle}
                  backgroundColor="$color9"
                  color="$gray11"
                  disabled={isProcessing}
                  onPress={async () => {
                    setPendingId(invitation.id)
                    try {
                      await onRespond(invitation.id, 'accept')
                    } finally {
                      setPendingId(null)
                    }
                  }}
                >
                  {isPending ? <Spinner size="sm" color="$gray11" /> : 'Accept'}
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
      const _message = error instanceof Error ? error.message : 'Unable to respond to invitation'
      toast.show({
        title: 'Unable to respond',
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

  if (!invitationsQuery.isLoading && invitations.length === 0) {
    return null
  }

  const handleRespond = async (invitationId: string, action: 'accept' | 'decline') => {
    await respondMutation.mutateAsync({
      invitationId,
      params: { action },
    })
  }

  return (
    <Card
      padding="md"
      borderColor="$borderColor"
      borderWidth={1}
      gap={16}
      backgroundColor="$color1"
    >
      <Row justify="space-between" align="center">
        <Row gap={8} align="center">
          <Users size="lg" />
          <Text>Team invitations</Text>
        </Row>
        <Button
          variant="outline"
          size="xs"
          onPress={() => router.push(ROUTES.DASHBOARD.TEAMS.INVITATIONS.path)}
        >
          Manage
        </Button>
      </Row>

      {invitationsQuery.isLoading ? (
        <Stack align="center" justify="center" paddingVertical={16} gap={8}>
          <Spinner size="lg" />
          <Text color="$gray11">Checking for invitations…</Text>
        </Stack>
      ) : (
        <>
          <TeamInvitationList
            invitations={topInvitations}
            onRespond={handleRespond}
            isProcessing={respondMutation.isPending}
            showEmptyStateDescription={false}
          />
          {remainingCount > 0 ? (
            <>
              <Separator />
              <Text color="$gray11">
                {remainingCount} more invitation{remainingCount === 1 ? '' : 's'} waiting in your
                inbox.
              </Text>
            </>
          ) : null}
        </>
      )}
    </Card>
  )
}
