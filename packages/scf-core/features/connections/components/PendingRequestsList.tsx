import { api } from '@scf/core/utils/api'
import { DataTable } from '@scf/core/components/ui'
import type { ColumnDef } from '@tanstack/react-table'
import { useToastController } from '@tamagui/toast'
import { CheckCircle2, X } from '@tamagui/lucide-icons'
import { useCallback, useMemo } from 'react'
import { Avatar, Button, Separator, Spinner, Text, XStack, YStack } from '@unicornlove/ui'

type PendingRequestsData = NonNullable<
  ReturnType<typeof api.connections.getPendingRequests.useQuery>['data']
> & {
  sent: Array<{
    id: string
    status: string
    created_at: string
    user: {
      id: string
      display_name: string | null
      username: string | null
      avatar_url: string | null
      headline: string | null
      industry?: { name: string } | null
    } | null
  }>
  received: Array<{
    id: string
    status: string
    created_at: string
    user: {
      id: string
      display_name: string | null
      username: string | null
      avatar_url: string | null
      headline: string | null
      industry?: { name: string } | null
    } | null
  }>
}

type PendingRequest = PendingRequestsData['sent'][number] & { type: 'sent' }

type ReceivedRequest = PendingRequestsData['received'][number] & { type: 'received' }

type RequestRow = PendingRequest | ReceivedRequest

export function PendingRequestsList() {
  const utils = api.useUtils()
  const toast = useToastController()

  const { data: pendingRequests, isLoading } = api.connections.getPendingRequests.useQuery()

  const acceptMutation = api.connections.acceptRequest.useMutation({
    onSuccess: () => {
      utils.connections.getPendingRequests.invalidate()
      utils.connections.getConnections.invalidate()
      toast.show('Success', {
        message: 'Connection request accepted',
      })
    },
    onError: (error) => {
      toast.show('Error', {
        message: error.message || 'Failed to accept request',
      })
    },
  })

  const declineMutation = api.connections.declineRequest.useMutation({
    onSuccess: () => {
      utils.connections.getPendingRequests.invalidate()
      toast.show('Success', {
        message: 'Connection request declined',
      })
    },
    onError: (error) => {
      toast.show('Error', {
        message: error.message || 'Failed to decline request',
      })
    },
  })

  const cancelMutation = api.connections.declineRequest.useMutation({
    onSuccess: () => {
      utils.connections.getPendingRequests.invalidate()
      toast.show('Success', {
        message: 'Connection request cancelled',
      })
    },
    onError: (error) => {
      toast.show('Error', {
        message: error.message || 'Failed to cancel request',
      })
    },
  })

  const combinedRequests: RequestRow[] = useMemo(() => {
    if (!pendingRequests) return []
    const sent: PendingRequest[] = (pendingRequests.sent || []).map(
      (req: PendingRequestsData['sent'][number]) => ({ ...req, type: 'sent' })
    )
    const received: ReceivedRequest[] = (pendingRequests.received || []).map(
      (req: PendingRequestsData['received'][number]) => ({
        ...req,
        type: 'received',
      })
    )
    return [...received, ...sent]
  }, [pendingRequests])

  const handleAccept = useCallback(
    async (connectionId: string) => {
      await acceptMutation.mutateAsync({ connectionId })
    },
    [acceptMutation.mutateAsync]
  )

  const handleDecline = useCallback(
    async (connectionId: string) => {
      await declineMutation.mutateAsync({ connectionId })
    },
    [declineMutation.mutateAsync]
  )

  const handleCancel = useCallback(
    async (connectionId: string) => {
      if (confirm('Are you sure you want to cancel this connection request?')) {
        await cancelMutation.mutateAsync({ connectionId })
      }
    },
    [cancelMutation.mutateAsync]
  )

  const columns = useMemo<ColumnDef<RequestRow>[]>(
    () => [
      {
        accessorKey: 'user',
        header: 'User',
        cell: ({ row }) => {
          const request = row.original
          const user = request.user
          const name = user?.display_name || user?.username || 'Unknown'
          const avatar = user?.avatar_url

          return (
            <XStack alignItems="center" gap="$2">
              <Avatar circular size={32}>
                {avatar ? (
                  <Avatar.Image source={{ uri: avatar }} />
                ) : (
                  <Avatar.Fallback backgroundColor="$orange4">
                    <Text fontSize="$3" fontWeight="600" color="$orange10">
                      {name.charAt(0).toUpperCase()}
                    </Text>
                  </Avatar.Fallback>
                )}
              </Avatar>
              <YStack gap="$1">
                <Text fontSize="$3" fontWeight="500">
                  {name}
                </Text>
                <Text fontSize="$2" color="$color10">
                  {request.type === 'sent' ? 'Sent' : 'Received'}
                </Text>
              </YStack>
            </XStack>
          )
        },
      },
      {
        accessorKey: 'industry',
        header: 'Industry',
        cell: ({ row }) => {
          const user = row.original.user
          return <Text fontSize="$3">{user?.industry?.name || '-'}</Text>
        },
      },
      {
        accessorKey: 'created_at',
        header: 'Date',
        cell: ({ row }) => {
          const date = row.original.created_at
          return (
            <Text fontSize="$3" color="$color10">
              {date ? new Date(date).toLocaleDateString() : '-'}
            </Text>
          )
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const request = row.original
          const isLoading =
            acceptMutation.isPending || declineMutation.isPending || cancelMutation.isPending

          if (request.type === 'sent') {
            return (
              <Button
                size="$2"
                variant="outlined"
                icon={X}
                onPress={() => handleCancel(request.id)}
                disabled={isLoading}
              >
                Cancel
              </Button>
            )
          }

          return (
            <XStack gap="$1">
              <Button
                size="$2"
                circular
                icon={CheckCircle2}
                theme="success"
                onPress={() => handleAccept(request.id)}
                disabled={isLoading}
              />
              <Button
                size="$2"
                circular
                icon={X}
                variant="outlined"
                onPress={() => handleDecline(request.id)}
                disabled={isLoading}
              />
            </XStack>
          )
        },
      },
    ],
    [
      acceptMutation.isPending,
      declineMutation.isPending,
      cancelMutation.isPending,
      handleAccept,
      handleDecline,
      handleCancel,
    ]
  )

  if (isLoading) {
    return (
      <YStack alignItems="center" justifyContent="center" paddingVertical="$6" gap="$2">
        <Spinner size="large" />
        <Text color="$color11">Loading pending requests…</Text>
      </YStack>
    )
  }

  const sentRequests = pendingRequests?.sent || []
  const receivedRequests = pendingRequests?.received || []

  if (combinedRequests.length === 0) {
    return (
      <YStack
        gap="$3"
        borderWidth={1}
        borderColor="$borderColor"
        borderRadius="$4"
        padding="$4"
        backgroundColor="$color2"
        alignItems="center"
        justifyContent="center"
        style={{ minHeight: 300 }}
      >
        <Text fontWeight="600">No pending requests</Text>
        <Text color="$color11" style={{ textAlign: 'center' }}>
          You don't have any pending connection requests. Send connection requests to build your
          network.
        </Text>
      </YStack>
    )
  }

  return (
    <YStack gap="$4">
      {receivedRequests.length > 0 && (
        <YStack gap="$2">
          <Text fontSize="$5" fontWeight="600">
            Received ({receivedRequests.length})
          </Text>
          <DataTable
            columns={columns}
            data={combinedRequests.filter((r) => r.type === 'received')}
            pageSize={10}
            emptyMessage="No received requests"
          />
        </YStack>
      )}

      {sentRequests.length > 0 && (
        <YStack gap="$2">
          {receivedRequests.length > 0 && <Separator />}
          <Text fontSize="$5" fontWeight="600">
            Sent ({sentRequests.length})
          </Text>
          <DataTable
            columns={columns}
            data={combinedRequests.filter((r) => r.type === 'sent')}
            pageSize={10}
            emptyMessage="No sent requests"
          />
        </YStack>
      )}
    </YStack>
  )
}
