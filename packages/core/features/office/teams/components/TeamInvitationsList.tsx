import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Select,
  Spinner,
  Text,
  XStack,
  YStack,
  useMedia,
  type GetThemeValueForKey,
} from 'tamagui';
import { Check, ChevronDown, Clock, RefreshCw, XCircle } from '@tamagui/lucide-icons';
import { useToastController } from '@tamagui/toast';
import type { AppRouter } from '@app/supabase/client-types';
import type { inferRouterOutputs } from '@trpc/server';

import { api } from '@app/core/utils/api';
import { TEAM_INVITATION_STATUSES } from '@app/schemas';

type InvitationsListOutput = inferRouterOutputs<AppRouter>['teams']['invitations']['list'];
type InvitationRecord = NonNullable<InvitationsListOutput['invitations']>[number];
type InvitationStatus = (typeof TEAM_INVITATION_STATUSES)[number];

const STATUS_LABELS: Record<InvitationStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  declined: 'Declined',
  expired: 'Expired',
  revoked: 'Revoked',
};

const STATUS_COLORS: Record<InvitationStatus, GetThemeValueForKey<'color'>> = {
  pending: '$orange10',
  accepted: '$green10',
  declined: '$red10',
  expired: '$color11',
  revoked: '$color11',
};

interface TeamInvitationsListProps {
  teamId: string;
  refreshKey?: number;
  headerAction?: ReactNode;
}

export function TeamInvitationsList({ teamId, refreshKey, headerAction }: TeamInvitationsListProps) {
  const toast = useToastController();
  const [statusFilter, setStatusFilter] = useState<InvitationStatus | 'all'>('pending');
  const media = useMedia();
  const isSmallScreen = media.sm; // sm = maxWidth: 800px

  const invitationsQuery = api.teams.invitations.list.useQuery(
    {
      teamId,
      status: statusFilter === 'all' ? undefined : statusFilter,
    },
    {
      enabled: Boolean(teamId),
    },
  );

  const resendMutation = api.teams.invitations.resend.useMutation({
    onSuccess: () => {
      toast.show('Invitation resent', { message: 'The invitation email has been resent.' });
      void invitationsQuery.refetch();
    },
    onError: (error: Error) => {
      toast.show('Unable to resend invitation', { message: error.message });
    },
  });

  const cancelMutation = api.teams.invitations.cancel.useMutation({
    onSuccess: () => {
      toast.show('Invitation cancelled', { message: 'The invitation can no longer be accepted.' });
      void invitationsQuery.refetch();
    },
    onError: (error: Error) => {
      toast.show('Unable to cancel invitation', { message: error.message });
    },
  });

  useEffect(() => {
    if (!invitationsQuery.isFetched) {
      return;
    }
    void invitationsQuery.refetch();
  }, [refreshKey]);

  const invitations = useMemo<InvitationRecord[]>(() => {
    return (invitationsQuery.data?.invitations ?? []) as InvitationRecord[];
  }, [invitationsQuery.data?.invitations]);

  const isLoading =
    invitationsQuery.isLoading ||
    invitationsQuery.isFetching ||
    resendMutation.isPending ||
    cancelMutation.isPending;

  const handleResend = async (invitationId: string) => {
    await resendMutation.mutateAsync({ invitationId, teamId });
  };

  const handleCancel = async (invitationId: string) => {
    await cancelMutation.mutateAsync({ invitationId, teamId });
  };

  return (
    <YStack gap="$4" px={isSmallScreen ? '$3' : undefined}>
      <XStack
        justify="space-between"
        items={isSmallScreen ? 'flex-start' : 'center'}
        flexWrap="wrap"
        gap="$3"
        flexDirection={isSmallScreen ? 'column' : 'row'}
        width="100%"
      >
        <Text fontSize="$6" fontWeight="700" accessibilityRole="header">
          Invitations
        </Text>
        <XStack
          gap="$2"
          items={isSmallScreen ? 'flex-start' : 'center'}
          flexDirection={isSmallScreen ? 'column' : 'row'}
          width={isSmallScreen ? '100%' : undefined}
        >
          {headerAction}
          <YStack width={isSmallScreen ? '100%' : undefined}>
            <Select
              native
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as InvitationStatus | 'all')}
              disablePreventBodyScroll
            >
              <Select.Trigger
                iconAfter={ChevronDown}
                accessibilityLabel="Filter invitations by status"
                accessibilityHint="Opens a menu of invitation statuses"
                flex={1}
              >
                <Select.Value placeholder="Filter status">
                  {statusFilter === 'all'
                    ? 'All statuses'
                    : STATUS_LABELS[statusFilter as InvitationStatus]}
                </Select.Value>
              </Select.Trigger>
              <Select.Content zIndex={1000}>
                <Select.ScrollUpButton />
                <Select.Viewport>
                  <Select.Group>
                    <Select.Label>Status</Select.Label>
                    <Select.Item value="all" index={0}>
                      <Select.ItemText>All statuses</Select.ItemText>
                      <Select.ItemIndicator>
                        <Check size={16} />
                      </Select.ItemIndicator>
                    </Select.Item>
                    {TEAM_INVITATION_STATUSES.map((status, index) => (
                      <Select.Item key={status} value={status} index={index + 1}>
                        <Select.ItemText>{STATUS_LABELS[status]}</Select.ItemText>
                        <Select.ItemIndicator>
                          <Check size={16} />
                        </Select.ItemIndicator>
                      </Select.Item>
                    ))}
                  </Select.Group>
                </Select.Viewport>
                <Select.ScrollDownButton />
              </Select.Content>
            </Select>
          </YStack>
        </XStack>
      </XStack>

      {invitationsQuery.isLoading ? (
        <YStack items="center" justify="center" gap="$2" py="$6">
          <Spinner size="large" />
          <Text color="$color11">Loading invitations…</Text>
        </YStack>
    ) : invitations.length === 0 ? (
        <YStack gap="$2" borderWidth={1} borderColor="$borderColor" rounded="$4" p="$4" bg="$color2">
          <Text fontWeight="600">No invitations yet</Text>
          <Text color="$color11">
            Invite teammates to collaborate on hiring. Invitations will appear here with their status.
          </Text>
        </YStack>
      ) : (
        <YStack gap="$3">
          {invitations.map((invitation) => {
            const statusLabel = STATUS_LABELS[invitation.status as InvitationStatus] ?? invitation.status;
            const statusColor =
              STATUS_COLORS[invitation.status as InvitationStatus] ?? '$color11';

            const sentAt = invitation.sentAt
              ? new Date(invitation.sentAt).toLocaleString()
              : null;
            const expiresAt = invitation.expiresAt
              ? new Date(invitation.expiresAt).toLocaleDateString()
              : null;

            const lastDeliveryMetadata =
              (invitation.metadata as Record<string, unknown> | null)?.lastDelivery ?? null;
            const lastDelivery =
              lastDeliveryMetadata && typeof lastDeliveryMetadata === 'object'
                ? (lastDeliveryMetadata as Record<string, unknown>)
                : null;

            const lastDeliveryStatus =
              invitation.lastDeliveryStatus ??
              (typeof lastDelivery?.status === 'string' ? (lastDelivery.status as string) : null);
            const lastDeliveryAt =
              invitation.sentAt
                ? new Date(invitation.sentAt).toLocaleString()
                : typeof lastDelivery?.updatedAt === 'string'
                  ? new Date(lastDelivery.updatedAt as string).toLocaleString()
                  : null;
            const deliveryChannels =
              invitation.lastDeliveryChannels ??
              (Array.isArray(lastDelivery?.channels)
                ? (lastDelivery.channels as string[])
                : null);
            const lastDeliveryError =
              invitation.lastDeliveryError ??
              (typeof lastDelivery?.error === 'string' ? (lastDelivery.error as string) : null);

            const isPending = invitation.status === 'pending';

            return (
              <Card
                key={invitation.id}
                p="$4"
                borderWidth={1}
                borderColor="$borderColor"
                gap="$3"
                bg="$color1"
                accessible
                accessibilityRole="summary"
                accessibilityLabel={`Invitation for ${invitation.email ?? invitation.invitedUserId ?? 'team member'} · Status ${statusLabel}${invitation.role?.name ? ` · Role ${invitation.role.name}` : ''}`}
              >
                <XStack justify="space-between" items="center">
                  <YStack gap="$1">
                    <Text fontWeight="600">
                      {invitation.email
                        ? invitation.email
                        : invitation.invitedUserId
                        ? `Existing member (${invitation.invitedUserId})`
                        : 'Invitation'}
                    </Text>
                    <XStack gap="$2" items="center">
                      <Clock size={16} color="$color11" />
                      <Text fontSize="$3" color="$color11">
                        Sent {sentAt ?? 'recently'}
                        {expiresAt ? ` · Expires ${expiresAt}` : null}
                      </Text>
                    </XStack>
                  </YStack>
                  <Text fontSize="$3" fontWeight="600" color={statusColor}>
                    {statusLabel}
                  </Text>
                </XStack>

                <XStack
                  gap="$2"
                  flexDirection={isSmallScreen ? 'column' : 'row'}
                  items={isSmallScreen ? 'stretch' : 'center'}
                >
                  <Text fontSize="$3" color="$color11">
                    Role:
                  </Text>
                  <Text fontSize="$3" fontWeight="500">
                    {invitation.role?.name ?? 'Member'}
                  </Text>
                </XStack>

                {lastDeliveryStatus ? (
                  <YStack gap="$1">
                    <Text fontSize="$3" color="$color11">
                      Delivery status:{' '}
                      <Text fontWeight="600" color="$color12">
                        {lastDeliveryStatus}
                      </Text>
                      {lastDeliveryAt ? ` · ${lastDeliveryAt}` : null}
                    </Text>
                    {deliveryChannels && deliveryChannels.length > 0 ? (
                      <Text fontSize="$2" color="$color10">
                        Channels: {deliveryChannels.join(', ')}
                      </Text>
                    ) : null}
                    {lastDeliveryError ? (
                      <Text fontSize="$2" color="$red10">
                        Last error: {lastDeliveryError}
                      </Text>
                    ) : null}
                  </YStack>
                ) : null}

                <XStack
                  gap="$2"
                  flexDirection={isSmallScreen ? 'column' : 'row'}
                  items={isSmallScreen ? 'stretch' : 'center'}
                >
                  <Text fontSize="$3" color="$color11">
                    Type:
                  </Text>
                  <Text fontSize="$3">
                    {invitation.email ? 'Email invitation' : 'Existing member'}
                  </Text>
                </XStack>

                <XStack
                  gap="$2"
                  justify={isSmallScreen ? 'flex-start' : 'flex-end'}
                  flexWrap="wrap"
                  flexDirection={isSmallScreen ? 'column' : 'row'}
                  items={isSmallScreen ? 'stretch' : 'center'}
                >
                  <Button
                    size="$2"
                    variant="outlined"
                    icon={RefreshCw}
                    disabled={!isPending || isLoading}
                    onPress={() => void handleResend(invitation.id)}
                    accessibilityLabel={`Resend invitation to ${invitation.email ?? invitation.invitedUserId ?? 'team member'}`}
                    width={isSmallScreen ? '100%' : undefined}
                  >
                    Resend
                  </Button>
                  <Button
                    size="$2"
                    variant="outlined"
                    color="$red10"
                    icon={XCircle}
                    disabled={!isPending || isLoading}
                    onPress={() => void handleCancel(invitation.id)}
                    accessibilityLabel={`Cancel invitation for ${invitation.email ?? invitation.invitedUserId ?? 'team member'}`}
                    width={isSmallScreen ? '100%' : undefined}
                  >
                    Cancel
                  </Button>
                </XStack>
              </Card>
            );
          })}
        </YStack>
      )}
    </YStack>
  );
}


