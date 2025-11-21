import { api } from '@app/core/utils/api'
import { useMemo } from 'react'

export function useConnectionStatus(targetUserId: string | null) {
  const { data: connections, isLoading: connectionsLoading } =
    api.connections.getConnections.useQuery(undefined, {
      enabled: !!targetUserId,
    })

  const { data: pendingRequests, isLoading: pendingLoading } =
    api.connections.getPendingRequests.useQuery(undefined, {
      enabled: !!targetUserId,
    })

  const status = useMemo(() => {
    if (!targetUserId || connectionsLoading || pendingLoading) {
      return {
        isConnected: false,
        isPending: false,
        isSent: false,
        isReceived: false,
        connectionId: null,
        isLoading: true,
      }
    }

    // Check if connected
    const connection = connections?.find(
      (conn: { user?: { id: string } | null; id: string }) => conn.user?.id === targetUserId
    )

    if (connection) {
      return {
        isConnected: true,
        isPending: false,
        isSent: false,
        isReceived: false,
        connectionId: connection.id,
        isLoading: false,
      }
    }

    // Check pending requests
    const sentRequest = pendingRequests?.sent.find(
      (req: { user?: { id: string } | null; id: string }) => req.user?.id === targetUserId
    )
    if (sentRequest) {
      return {
        isConnected: false,
        isPending: true,
        isSent: true,
        isReceived: false,
        connectionId: sentRequest.id,
        isLoading: false,
      }
    }

    const receivedRequest = pendingRequests?.received.find(
      (req: { user?: { id: string } | null; id: string }) => req.user?.id === targetUserId
    )
    if (receivedRequest) {
      return {
        isConnected: false,
        isPending: true,
        isSent: false,
        isReceived: true,
        connectionId: receivedRequest.id,
        isLoading: false,
      }
    }

    return {
      isConnected: false,
      isPending: false,
      isSent: false,
      isReceived: false,
      connectionId: null,
      isLoading: false,
    }
  }, [targetUserId, connections, pendingRequests, connectionsLoading, pendingLoading])

  return status
}

