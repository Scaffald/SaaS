import { TeamInvitationList } from '@scf/core/features/dashboard/components'
import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { RefreshCw } from 'lucide-react-native'
import { useMemo } from 'react'
import { Button, Spinner, Text, Row, Stack, useToast } from '@unicornlove/beyond-ui'
import { useMyTeamInvitations, useRespondToTeamInvitation } from '@scaffald/sdk/react'

export default function DashboardTeamInvitationsScreen() {
  const toast = useToast()

  const invitationsQuery = useMyTeamInvitations({ status: 'pending' })

  const respondMutation = useRespondToTeamInvitation({
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unable to respond to invitation'
      toast.show({
        title: 'Unable to respond',
        message,
        variant: 'error',
      })
    },
    onSuccess: (result) => {
      const invitation = result.invitation
      toast.show({
        title: invitation.status === 'accepted' ? 'Invitation accepted' : 'Invitation declined',
        message:
          invitation.status === 'accepted'
            ? 'You now have access to the team.'
            : 'You can accept again later if needed.',
        variant: invitation.status === 'accepted' ? 'success' : 'info',
      })
    },
  })

  const invitations = useMemo(
    () => invitationsQuery.data?.invitations ?? [],
    [invitationsQuery.data?.invitations]
  )

  const handleRespond = async (invitationId: string, action: 'accept' | 'decline') => {
    await respondMutation.mutateAsync({ invitationId, params: { action } })
  }

  const content = (
    <Stack padding={16} gap={20}>
      <Stack gap={8}>
        <Text>
          Team invitations
        </Text>
        <Text color="gray">
          Review pending invitations from team administrators. Accept to join collaborative hiring
          spaces or decline to keep your dashboard focused.
        </Text>
      </Stack>

      <Row gap={8} justify="flex-end">
        <Button
          variant="outline"
          size="md"
          iconStart={RefreshCw}
          onPress={() => invitationsQuery.refetch()}
          disabled={invitationsQuery.isFetching}
        >
          Refresh
        </Button>
      </Row>

      {invitationsQuery.isLoading ? (
        <Stack align="center" justify="center" gap={8} paddingVertical="$10">
          <Spinner size="lg" />
          <Text color="gray">Loading invitations…</Text>
        </Stack>
      ) : (
        <TeamInvitationList
          invitations={invitations}
          onRespond={handleRespond}
          isProcessing={respondMutation.isPending}
        />
      )}
    </Stack>
  )

  return <DashboardPage showBreadcrumb={false} pageTitle="Team invitations" leftContent={content} />
}
