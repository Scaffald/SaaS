import { useConnections, usePendingConnections } from '@scf/core/utils/engagement-sdk-hooks'
import { useMemo } from 'react'

export function useConnectionStatus(targetUserId: string | null) {
  const { data: connectionsData, isLoading: connectionsLoading } = useConnections({
    enabled: !!targetUserId,
  })

  const { data: pendingData, isLoading: pendingLoading } = usePendingConnections({
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
    const connection = connectionsData?.data.find(
      (conn: { addressee_id?: string; requester_id?: string; id: string }) =>
        conn.addressee_id === targetUserId || conn.requester_id === targetUserId
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
    const sentRequest = pendingData?.sent.find(
      (req: { addressee_id?: string; id: string }) => req.addressee_id === targetUserId
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

    const receivedRequest = pendingData?.received.find(
      (req: { requester_id?: string; id: string }) => req.requester_id === targetUserId
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
  }, [targetUserId, connectionsData, pendingData, connectionsLoading, pendingLoading])

  return status
}

