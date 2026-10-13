import { TeamInvitationList } from '@scf/core/features/dashboard/components'
import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { RefreshCw } from 'lucide-react-native'
import { useMemo } from 'react'
import { Button, Spinner, Text, Stack, useToast } from '@scaffald/ui'
import { useMyTeamInvitations, useRespondToTeamInvitation } from '@scaffald/sdk/react'

export default function OrgInvitationsPage() {
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
    // No padding of its own: DashboardPage already supplies the gutter, and
    // paying it twice inset this screen ~32px per side at 390 (#1126).
    <Stack gap={20}>
      {invitationsQuery.isLoading ? (
        <Stack align="center" justify="center" gap={8} paddingVertical="lg">
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

  // The shared header carries the tip and Refresh. This screen drew its own
  // title in body text, with the tip in low-contrast grey and Refresh on a
  // right-aligned row of its own.
  return (
    <DashboardPage
      showBreadcrumb={false}
      pageTitle="Invitations"
      screenTip="Review pending team invitations. Accept to join organizations and teams or decline to keep your list focused."
      screenActions={
        <Button
          variant="outline"
          size="sm"
          iconStart={RefreshCw}
          onPress={() => invitationsQuery.refetch()}
          disabled={invitationsQuery.isFetching}
        >
          Refresh
        </Button>
      }
      leftContent={content}
    />
  )
}
