import {
  usePendingConnections,
  useAcceptConnectionMutation,
  useDeclineConnectionMutation,
  useCancelConnectionMutation,
} from '@scf/core/utils/engagement-sdk-hooks'
import { columnsFromTanStack } from '@scf/core/utils/table-columns'
import type { ColumnDef } from '@tanstack/react-table'
import { useToast } from '@scaffald/ui'
import { CheckCircle2, X } from 'lucide-react-native'
import { useCallback, useMemo } from 'react'
import { Avatar, Button, Separator, Spinner, Table, Text, Row, Stack } from '@scaffald/ui'
import { useQueryClient } from '@tanstack/react-query'

interface PendingRequestBase {
  id: string
  requester_id: string
  addressee_id: string
  status: 'pending'
  created_at: string
  requester: {
    id: string
    first_name: string
    last_name: string
    avatar_url?: string
  }
}

type PendingRequest = PendingRequestBase & { type: 'sent' }
type ReceivedRequest = PendingRequestBase & { type: 'received' }
type RequestRow = PendingRequest | ReceivedRequest

export function PendingRequestsList() {
  const queryClient = useQueryClient()
  const toast = useToast()

  const { data: pendingResponse, isLoading } = usePendingConnections()
  const pendingRequests = pendingResponse || { sent: [], received: [] }

  const acceptMutation = useAcceptConnectionMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections', 'pending'] })
      queryClient.invalidateQueries({ queryKey: ['connections', 'list'] })
      toast.show({
        title: 'Success',
        message: 'Connection request accepted',
        variant: 'success',
      })
    },
    onError: (error: { message?: string }) => {
      toast.show({
        title: 'Error',
        message: error.message || 'Failed to accept request',
        variant: 'error',
      })
    },
  })

  const declineMutation = useDeclineConnectionMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections', 'pending'] })
      toast.show({
        title: 'Success',
        message: 'Connection request declined',
        variant: 'success',
      })
    },
    onError: (error: { message?: string }) => {
      toast.show({
        title: 'Error',
        message: error.message || 'Failed to decline request',
        variant: 'error',
      })
    },
  })

  const cancelMutation = useCancelConnectionMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections', 'pending'] })
      toast.show({
        title: 'Success',
        message: 'Connection request cancelled',
        variant: 'success',
      })
    },
    onError: (error: { message?: string }) => {
      toast.show({
        title: 'Error',
        message: error.message || 'Failed to cancel request',
        variant: 'error',
      })
    },
  })

  const combinedRequests: RequestRow[] = useMemo(() => {
    const sent: PendingRequest[] = (pendingRequests.sent || []).map((req) => ({
      ...req,
      type: 'sent' as const,
    }))
    const received: ReceivedRequest[] = (pendingRequests.received || []).map((req) => ({
      ...req,
      type: 'received' as const,
    }))
    return [...received, ...sent]
  }, [pendingRequests])

  const handleAccept = useCallback(
    async (connectionId: string) => {
      await acceptMutation.mutateAsync(connectionId)
    },
    [acceptMutation]
  )

  const handleDecline = useCallback(
    async (connectionId: string) => {
      await declineMutation.mutateAsync(connectionId)
    },
    [declineMutation]
  )

  const handleCancel = useCallback(
    async (connectionId: string) => {
      if (confirm('Are you sure you want to cancel this connection request?')) {
        await cancelMutation.mutateAsync(connectionId)
      }
    },
    [cancelMutation]
  )

  const columnDefs = useMemo<ColumnDef<RequestRow>[]>(
    () => [
      {
        accessorKey: 'requester',
        header: 'User',
        cell: ({ row }) => {
          const request = row.original
          const user = request.requester
          const name = `${user.first_name} ${user.last_name}`.trim() || 'Unknown'
          const avatar = user.avatar_url

          return (
            <Row align="center" gap={8}>
              <Avatar size={32}>
                {avatar ? (
                  <Avatar.Image source={{ uri: avatar }} />
                ) : (
                  <Avatar.Fallback backgroundColor="$orange4">
                    <Text color="$orange10">{name.charAt(0).toUpperCase()}</Text>
                  </Avatar.Fallback>
                )}
              </Avatar>
              <Stack gap={4}>
                <Text>{name}</Text>
                <Text color="$gray11">{request.type === 'sent' ? 'Sent' : 'Received'}</Text>
              </Stack>
            </Row>
          )
        },
      },
      {
        accessorKey: 'created_at',
        header: 'Date',
        cell: ({ row }) => {
          const date = row.original.created_at
          return <Text color="$gray11">{date ? new Date(date).toLocaleDateString() : '-'}</Text>
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
                size="sm"
                variant="outline"
                iconStart={X}
                onPress={() => handleCancel(request.id)}
                disabled={isLoading}
              >
                Cancel
              </Button>
            )
          }

          return (
            <Row gap={4}>
              <Button
                size="sm"
                iconStart={CheckCircle2}
                theme="success"
                onPress={() => handleAccept(request.id)}
                disabled={isLoading}
              />
              <Button
                size="sm"
                iconStart={X}
                variant="outline"
                onPress={() => handleDecline(request.id)}
                disabled={isLoading}
              />
            </Row>
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

  const tableColumns = useMemo(
    () => columnsFromTanStack<RequestRow>(columnDefs),
    [columnDefs]
  )

  if (isLoading) {
    return (
      <Stack align="center" justify="center" paddingVertical={24} gap={8}>
        <Spinner size="lg" />
        <Text color="$gray11">Loading pending requests…</Text>
      </Stack>
    )
  }

  const sentRequests = pendingRequests?.sent || []
  const receivedRequests = pendingRequests?.received || []

  if (combinedRequests.length === 0) {
    return (
      <Stack
        gap={12}
        borderWidth={1}
        borderColor="$borderColor"
        borderRadius={16}
        padding="md"
        backgroundColor="$color2"
        align="center"
        justify="center"
        style={{ minHeight: 300 }}
      >
        <Text>No pending requests</Text>
        <Text color="$gray11" style={{ textAlign: 'center' }}>
          You don't have any pending connection requests. Send connection requests to build your
          network.
        </Text>
      </Stack>
    )
  }

  return (
    <Stack gap={16}>
      {receivedRequests.length > 0 && (
        <Stack gap={8}>
          <Text>Received ({receivedRequests.length})</Text>
          <Table
            columns={tableColumns}
            data={combinedRequests.filter((r) => r.type === 'received')}
            pageSize={10}
            emptyMessage="No received requests"
          />
        </Stack>
      )}

      {sentRequests.length > 0 && (
        <Stack gap={8}>
          {receivedRequests.length > 0 && <Separator />}
          <Text>Sent ({sentRequests.length})</Text>
          <Table
            columns={tableColumns}
            data={combinedRequests.filter((r) => r.type === 'sent')}
            pageSize={10}
            emptyMessage="No sent requests"
          />
        </Stack>
      )}
    </Stack>
  )
}
