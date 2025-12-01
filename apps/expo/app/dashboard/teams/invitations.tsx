import { TeamInvitationList } from '@app/core/features/dashboard/components'
import { DashboardPage } from '@app/core/features/dashboard/DashboardPage'
import { api } from '@app/core/utils/api'
import type { AppRouter } from '@app/supabase/client-types'
import { RefreshCw } from '@tamagui/lucide-icons'
import { useToastController } from '@tamagui/toast'
import type { inferRouterOutputs } from '@trpc/server'
import { useMemo } from 'react'
import { Button, Spinner, Text, XStack, YStack } from '@unicornlove/ui'

type InvitationRespondOutput = inferRouterOutputs<AppRouter>['teams']['invitations']['respond']

export default function DashboardTeamInvitationsScreen() {
  const toast = useToastController()

  const invitationsQuery = api.teams.invitations.mine.useQuery({ status: 'pending' })

  const respondMutation = api.teams.invitations.respond.useMutation({
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unable to respond to invitation'
      toast.show('Unable to respond', { message })
    },
    onSuccess: (result: InvitationRespondOutput) => {
      toast.show(result.status === 'accepted' ? 'Invitation accepted' : 'Invitation declined', {
        message:
          result.status === 'accepted'
            ? 'You now have access to the team.'
            : 'You can accept again later if needed.',
      })
      void invitationsQuery.refetch()
    },
  })

  const invitations = useMemo(
    () => invitationsQuery.data?.invitations ?? [],
    [invitationsQuery.data?.invitations]
  )

  const handleRespond = async (invitationId: string, action: 'accept' | 'decline') => {
    await respondMutation.mutateAsync({ action, invitationId })
  }

  const content = (
    <YStack flex={1} padding="$4" gap="$5">
      <YStack gap="$2">
        <Text fontSize="$7" fontWeight="700">
          Team invitations
        </Text>
        <Text color="$color11">
          Review pending invitations from team administrators. Accept to join collaborative hiring
          spaces or decline to keep your dashboard focused.
        </Text>
      </YStack>

      <XStack gap="$2" justifyContent="flex-end">
        <Button
          variant="outlined"
          size="$2"
          icon={RefreshCw}
          onPress={() => invitationsQuery.refetch()}
          disabled={invitationsQuery.isFetching}
        >
          Refresh
        </Button>
      </XStack>

      {invitationsQuery.isLoading ? (
        <YStack alignItems="center" justifyContent="center" gap="$2" paddingVertical="$10">
          <Spinner size="large" />
          <Text color="$color11">Loading invitations…</Text>
        </YStack>
      ) : (
        <TeamInvitationList
          invitations={invitations}
          onRespond={handleRespond}
          isProcessing={respondMutation.isPending}
        />
      )}
    </YStack>
  )

  return <DashboardPage showBreadcrumb={false} pageTitle="Team invitations" leftContent={content} />
}
