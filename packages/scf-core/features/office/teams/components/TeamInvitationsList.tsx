import { api } from '@scf/core/utils/api'
import { TEAM_INVITATION_STATUSES } from '@scf/schemas'
import type { AppRouter } from '@scf/supabase/client-types'
import { Clock, RefreshCw, XCircle } from '@tamagui/lucide-icons'
import { useToast } from '@unicornlove/beyond-ui'
import type { inferRouterOutputs } from '@trpc/server'
import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { ResponsiveSelect } from '@unicornlove/beyond-ui'
import {
  Button,
  Card,
  type GetThemeValueForKey,
  Spinner,
  Text,
  Row,
  Stack,
} from '@unicornlove/beyond-ui'

type InvitationsListOutput = inferRouterOutputs<AppRouter>['teams']['invitations']['list']
type InvitationRecord = NonNullable<InvitationsListOutput['invitations']>[number]
type InvitationStatus = (typeof TEAM_INVITATION_STATUSES)[number]

const STATUS_LABELS: Record<InvitationStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  declined: 'Declined',
  expired: 'Expired',
  revoked: 'Revoked',
}

const STATUS_COLORS: Record<InvitationStatus, GetThemeValueForKey<'color'>> = {
  pending: '$orange10',
  accepted: '$green10',
  declined: '$red10',
  expired: '$color11',
  revoked: '$color11',
}

interface TeamInvitationsListProps {
  teamId: string
  refreshKey?: number
  headerAction?: ReactNode
}

export function TeamInvitationsList({
  teamId,
  refreshKey,
  headerAction,
}: TeamInvitationsListProps) {
  const toast = useToast()
  const [statusFilter, setStatusFilter] = useState<InvitationStatus | 'all'>('pending')

  const invitationsQuery = api.teams.invitations.list.useQuery(
    {
      teamId,
      status: statusFilter === 'all' ? undefined : statusFilter,
    },
    {
      enabled: Boolean(teamId),
    }
  )

  const resendMutation = api.teams.invitations.resend.useMutation({
    onSuccess: () => {
      toast.show({
          title: 'Invitation resent',
          message: 'The invitation email has been resent.',
        })
      void invitationsQuery.refetch()
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'An error occurred'
      toast.show({
          title: 'Unable to resend invitation',
          variant: 'error',
        })
    },
  })

  const cancelMutation = api.teams.invitations.cancel.useMutation({
    onSuccess: () => {
      toast.show({
          title: 'Invitation cancelled',
          message: 'The invitation can no longer be accepted.',
        })
      void invitationsQuery.refetch()
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'An error occurred'
      toast.show({
          title: 'Unable to cancel invitation',
          variant: 'error',
        })
    },
  })

  useEffect(() => {
    if (!invitationsQuery.isFetched || !refreshKey) {
      return
    }
    void invitationsQuery.refetch()
  }, [refreshKey, invitationsQuery.isFetched, invitationsQuery.refetch, invitationsQuery])

  const invitations = useMemo<InvitationRecord[]>(() => {
    return (invitationsQuery.data?.invitations ?? []) as InvitationRecord[]
  }, [invitationsQuery.data?.invitations])

  const isLoading =
    invitationsQuery.isLoading ||
    invitationsQuery.isFetching ||
    resendMutation.isPending ||
    cancelMutation.isPending

  const handleResend = async (invitationId: string) => {
    await resendMutation.mutateAsync({ invitationId, teamId })
  }

  const handleCancel = async (invitationId: string) => {
    await cancelMutation.mutateAsync({ invitationId, teamId })
  }

  return (
    <Stack gap="$4" paddingHorizontal="$3" $md={{ paddingHorizontal: undefined }}>
      <Row
        justifyContent="space-between"
        alignItems="flex-start"
        flexWrap="wrap"
        gap="$3"
        flexDirection="column"
        width="100%"
        $md={{
          alignItems: 'center',
          flexDirection: 'row',
        }}
      >
        <Text fontSize="$6" fontWeight="700" accessibilityRole="header">
          Invitations
        </Text>
        <Row
          gap="$2"
          alignItems="flex-start"
          flexDirection="column"
          width="100%"
          $md={{
            alignItems: 'center',
            flexDirection: 'row',
            width: undefined,
          }}
        >
          {headerAction}
          <Stack width="100%" $md={{ width: undefined }}>
            <ResponsiveSelect
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as InvitationStatus | 'all')}
              placeholder={
                statusFilter === 'all'
                  ? 'All statuses'
                  : STATUS_LABELS[statusFilter as InvitationStatus]
              }
              options={[
                { value: 'all', label: 'All statuses' },
                ...TEAM_INVITATION_STATUSES.map((status) => ({
                  value: status,
                  label: STATUS_LABELS[status],
                })),
              ]}
              triggerProps={{
                accessibilityLabel: 'Filter invitations by status',
                accessibilityHint: 'Opens a menu of invitation statuses',
                flex: 1,
              }}
            />
          </Stack>
        </Row>
      </Row>

      {invitationsQuery.isLoading ? (
        <Stack alignItems="center" justifyContent="center" gap="$2" paddingVertical="$6">
          <Spinner size="large" />
          <Text color="$color11">Loading invitations…</Text>
        </Stack>
      ) : invitations.length === 0 ? (
        <Stack
          gap="$2"
          borderWidth={1}
          borderColor="$borderColor"
          borderRadius="$4"
          padding="$4"
          backgroundColor="$color2"
        >
          <Text fontWeight="600">No invitations yet</Text>
          <Text color="$color11">
            Invite teammates to collaborate on hiring. Invitations will appear here with their
            status.
          </Text>
        </Stack>
      ) : (
        <Stack gap="$3">
          {invitations.map((invitation) => {
            const statusLabel =
              STATUS_LABELS[invitation.status as InvitationStatus] ?? invitation.status
            const statusColor = STATUS_COLORS[invitation.status as InvitationStatus] ?? '$color11'

            const sentAt = invitation.sentAt ? new Date(invitation.sentAt).toLocaleString() : null
            const expiresAt = invitation.expiresAt
              ? new Date(invitation.expiresAt).toLocaleDateString()
              : null

            const lastDeliveryMetadata =
              (invitation.metadata as Record<string, unknown> | null)?.lastDelivery ?? null
            const lastDelivery =
              lastDeliveryMetadata && typeof lastDeliveryMetadata === 'object'
                ? (lastDeliveryMetadata as Record<string, unknown>)
                : null

            const lastDeliveryStatus =
              invitation.lastDeliveryStatus ??
              (typeof lastDelivery?.status === 'string' ? (lastDelivery.status as string) : null)
            const lastDeliveryAt = invitation.sentAt
              ? new Date(invitation.sentAt).toLocaleString()
              : typeof lastDelivery?.updatedAt === 'string'
                ? new Date(lastDelivery.updatedAt as string).toLocaleString()
                : null
            const deliveryChannels =
              invitation.lastDeliveryChannels ??
              (Array.isArray(lastDelivery?.channels) ? (lastDelivery.channels as string[]) : null)
            const lastDeliveryError =
              invitation.lastDeliveryError ??
              (typeof lastDelivery?.error === 'string' ? (lastDelivery.error as string) : null)

            const isPending = invitation.status === 'pending'

            return (
              <Card
                key={invitation.id}
                padding="$4"
                borderWidth={1}
                borderColor="$borderColor"
                gap="$3"
                backgroundColor="$color1"
                accessible
                accessibilityRole="summary"
                accessibilityLabel={`Invitation for ${invitation.email ?? invitation.invitedUserId ?? 'team member'} · Status ${statusLabel}${invitation.role?.name ? ` · Role ${invitation.role.name}` : ''}`}
              >
                <Row justifyContent="space-between" alignItems="center">
                  <Stack gap="$1">
                    <Text fontWeight="600">
                      {invitation.email
                        ? invitation.email
                        : invitation.invitedUserId
                          ? `Existing member (${invitation.invitedUserId})`
                          : 'Invitation'}
                    </Text>
                    <Row gap="$2" alignItems="center">
                      <Clock size={16} color="$color11" />
                      <Text fontSize="$3" color="$color11">
                        Sent {sentAt ?? 'recently'}
                        {expiresAt ? ` · Expires ${expiresAt}` : null}
                      </Text>
                    </Row>
                  </Stack>
                  <Text fontSize="$3" fontWeight="600" color={statusColor}>
                    {statusLabel}
                  </Text>
                </Row>

                <Row
                  gap="$2"
                  flexDirection="column"
                  alignItems="stretch"
                  $md={{
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <Text fontSize="$3" color="$color11">
                    Role:
                  </Text>
                  <Text fontSize="$3" fontWeight="500">
                    {invitation.role?.name ?? 'Member'}
                  </Text>
                </Row>

                {lastDeliveryStatus ? (
                  <Stack gap="$1">
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
                  </Stack>
                ) : null}

                <Row
                  gap="$2"
                  flexDirection="column"
                  alignItems="stretch"
                  $md={{
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <Text fontSize="$3" color="$color11">
                    Type:
                  </Text>
                  <Text fontSize="$3">
                    {invitation.email ? 'Email invitation' : 'Existing member'}
                  </Text>
                </Row>

                <Row
                  gap="$2"
                  justifyContent="flex-start"
                  flexWrap="wrap"
                  flexDirection="column"
                  alignItems="stretch"
                  $md={{
                    justify: 'flex-end',
                    flexDirection: 'row',
                    items: 'center',
                  }}
                >
                  <Button
                    size="$2"
                    variant="outlined"
                    icon={RefreshCw}
                    disabled={!isPending || isLoading}
                    onPress={() => void handleResend(invitation.id)}
                    accessibilityLabel={`Resend invitation to ${invitation.email ?? invitation.invitedUserId ?? 'team member'}`}
                    width="100%"
                    $md={{ width: undefined }}
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
                    width="100%"
                    $md={{ width: undefined }}
                  >
                    Cancel
                  </Button>
                </Row>
              </Card>
            )
          })}
        </Stack>
      )}
    </Stack>
  )
}
