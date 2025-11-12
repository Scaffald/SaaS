import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Button, Card, Separator, Spinner, Text, XStack, YStack } from 'tamagui';
import { CheckCircle, Clock, Users, XCircle } from '@tamagui/lucide-icons';
import { useToastController } from '@tamagui/toast';
import type { AppRouter } from '@app/supabase/client-types';
import type { inferRouterOutputs } from '@trpc/server';

import { api } from '@app/core/utils/api';
import { RouteBuilder } from '@app/core/constants/routes';

type InvitationsOutput = inferRouterOutputs<AppRouter>['teams']['invitations']['mine'];
type InvitationRecord = NonNullable<InvitationsOutput['invitations']>[number];
type InvitationRespondOutput = inferRouterOutputs<AppRouter>['teams']['invitations']['respond'];

interface TeamInvitationListProps {
  invitations: InvitationRecord[];
  onRespond: (invitationId: string, action: 'accept' | 'decline') => Promise<void>;
  isProcessing?: boolean;
  showEmptyStateDescription?: boolean;
}

export function TeamInvitationList({
  invitations,
  onRespond,
  isProcessing = false,
  showEmptyStateDescription = true,
}: TeamInvitationListProps) {
  const [pendingId, setPendingId] = useState<string | null>(null);

  if (!invitations.length) {
    return (
      <YStack gap="$2" borderWidth={1} borderColor="$borderColor" rounded="$4" p="$4" bg="$color2">
        <Text fontWeight="600">No pending invitations</Text>
        {showEmptyStateDescription ? (
          <Text color="$color11">
            You&apos;re all caught up. New invitations will appear here for quick review.
          </Text>
        ) : null}
      </YStack>
    );
  }

  return (
    <YStack gap="$3">
      {invitations.map((invitation) => {
        const teamName = invitation.team?.name ?? 'Team';
        const organizationName = invitation.team?.organizationName ?? 'Organization';
        const sentAt = invitation.sentAt ? new Date(invitation.sentAt).toLocaleString() : null;
        const expiresAt = invitation.expiresAt ? new Date(invitation.expiresAt).toLocaleDateString() : null;

        const isPending = pendingId === invitation.id;

        return (
          <Card
            key={invitation.id}
            p="$4"
            borderWidth={1}
            borderColor="$borderColor"
            gap="$3"
            bg="$color1"
          >
            <XStack justify="space-between" items="center">
              <YStack gap="$1" flex={1}>
                <Text fontWeight="700">{teamName}</Text>
                <Text fontSize="$3" color="$color11">
                  {organizationName}
                </Text>
                <XStack gap="$2" items="center" mt="$2">
                  <Clock size={16} color="$color11" />
                  <Text fontSize="$3" color="$color11">
                    Sent {sentAt ?? 'recently'}
                    {expiresAt ? ` · Expires ${expiresAt}` : null}
                  </Text>
                </XStack>
              </YStack>
                <XStack gap="$2" ml="$4" shrink={0} flexWrap="wrap" justify="flex-end">
                <Button
                  size="$2"
                  icon={XCircle}
                  variant="outlined"
                  color="$red10"
                  disabled={isProcessing}
                  onPress={async () => {
                    setPendingId(invitation.id);
                    try {
                      await onRespond(invitation.id, 'decline');
                    } finally {
                      setPendingId(null);
                    }
                  }}
                >
                  Decline
                </Button>
                <Button
                  size="$2"
                  icon={CheckCircle}
                  bg="$color9"
                  color="$color1"
                  disabled={isProcessing}
                  onPress={async () => {
                    setPendingId(invitation.id);
                    try {
                      await onRespond(invitation.id, 'accept');
                    } finally {
                      setPendingId(null);
                    }
                  }}
                >
                  {isPending ? <Spinner size="small" color="$color1" /> : 'Accept'}
                </Button>
              </XStack>
            </XStack>
          </Card>
        );
      })}
    </YStack>
  );
}

export function TeamInvitationsWidget() {
  const router = useRouter();
  const toast = useToastController();

  const invitationsQuery = api.teams.invitations.mine.useQuery(
    { status: 'pending' },
    {
      staleTime: 30_000,
    },
  );

  const respondMutation = api.teams.invitations.respond.useMutation({
    onSuccess: (result: InvitationRespondOutput) => {
      toast.show(
        result.status === 'accepted' ? 'Invitation accepted' : 'Invitation declined',
        {
          message:
            result.status === 'accepted'
              ? 'You now have access to the team.'
              : 'You can accept again later if you change your mind.',
        },
      );
      void invitationsQuery.refetch();
    },
    onError: (error: Error) => {
      toast.show('Unable to respond', { message: error.message });
    },
  });

  const invitations = useMemo(
    () => (invitationsQuery.data?.invitations ?? []) as InvitationRecord[],
    [invitationsQuery.data?.invitations],
  );

  const topInvitations = invitations.slice(0, 3);
  const remainingCount = Math.max(invitations.length - topInvitations.length, 0);

  const handleRespond = async (invitationId: string, action: 'accept' | 'decline') => {
    await respondMutation.mutateAsync({
      invitationId,
      action,
    });
  };

  return (
    <Card p="$4" borderColor="$borderColor" borderWidth={1} gap="$4" bg="$color1">
      <XStack justify="space-between" items="center">
        <XStack gap="$2" items="center">
          <Users size={20} />
          <Text fontWeight="700">Team invitations</Text>
        </XStack>
        <Button
          variant="outlined"
          size="$2"
          onPress={() => router.push(RouteBuilder.dashboardTeamsInvitations())}
        >
          Manage
        </Button>
      </XStack>

      {invitationsQuery.isLoading ? (
        <YStack items="center" justify="center" py="$4" gap="$2">
          <Spinner size="large" />
          <Text color="$color11">Checking for invitations…</Text>
        </YStack>
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
              <Text fontSize="$3" color="$color11">
                {remainingCount} more invitation{remainingCount === 1 ? '' : 's'} waiting in your inbox.
              </Text>
            </>
          ) : null}
        </>
      )}
    </Card>
  );
}


