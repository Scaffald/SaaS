import { useConnectionStatus } from '@scf/core/features/user-profile/hooks/useConnectionStatus'
import { useFollowStatus } from '@scf/core/features/user-profile/hooks/useFollowStatus'
import { api } from '@scf/core/utils/api'
import { DashboardWidget } from '@unicornlove/beyond-ui'
import { CheckCircle2, Loader2, UserCheck, UserMinus, UserPlus, X } from 'lucide-react-native'
import { useToast } from '@unicornlove/beyond-ui'
import { useMemo } from 'react'
import { Button, Text, Row, Stack } from '@unicornlove/beyond-ui'

interface ConnectionFollowButtonsProps {
  targetUserId: string
  isOwnProfile?: boolean
}

/**
 * ConnectionFollowButtons Component
 * Displays Connect and Follow buttons for user profiles
 * Used in worker detail pages and other profile views
 */
export function ConnectionFollowButtons({
  targetUserId,
  isOwnProfile = false,
}: ConnectionFollowButtonsProps) {
  const toast = useToast()
  const utils = api.useUtils()

  // Don't show buttons for own profile
  if (isOwnProfile || !targetUserId) {
    return null
  }

  // Connection and follow status hooks
  const connectionStatus = useConnectionStatus(targetUserId)
  const followStatus = useFollowStatus(targetUserId)

  // Connection mutations
  const sendRequestMutation = api.connections.sendRequest.useMutation({
    onMutate: async () => {
      await utils.connections.getConnections.cancel()
      await utils.connections.getPendingRequests.cancel()
    },
    onSuccess: () => {
      utils.connections.getConnections.invalidate()
      utils.connections.getPendingRequests.invalidate()
      toast.show({
          title: 'Connection request sent',
          message: 'Your connection request has been sent.',
        })
    },
    onError: (error: { message?: string }) => {
      toast.show({
          title: 'Unable to send request',
          message: error.message ?? 'Please try again in a moment.',
          variant: 'error',
        })
    },
  })

  const acceptRequestMutation = api.connections.acceptRequest.useMutation({
    onMutate: async () => {
      await utils.connections.getConnections.cancel()
      await utils.connections.getPendingRequests.cancel()
    },
    onSuccess: () => {
      utils.connections.getConnections.invalidate()
      utils.connections.getPendingRequests.invalidate()
      toast.show({
          title: 'Connection accepted',
          message: 'You are now connected.',
        })
    },
    onError: (error: { message?: string }) => {
      toast.show({
          title: 'Unable to accept request',
          message: error.message ?? 'Please try again in a moment.',
          variant: 'error',
        })
    },
  })

  const declineRequestMutation = api.connections.declineRequest.useMutation({
    onMutate: async () => {
      await utils.connections.getPendingRequests.cancel()
    },
    onSuccess: () => {
      utils.connections.getPendingRequests.invalidate()
      toast.show({
          title: 'Connection request declined',
          message: 'The connection request has been declined.',
        })
    },
    onError: (error: { message?: string }) => {
      toast.show({
          title: 'Unable to decline request',
          message: error.message ?? 'Please try again in a moment.',
          variant: 'error',
        })
    },
  })

  const removeConnectionMutation = api.connections.removeConnection.useMutation({
    onMutate: async () => {
      await utils.connections.getConnections.cancel()
    },
    onSuccess: () => {
      utils.connections.getConnections.invalidate()
      toast.show({
          title: 'Connection removed',
          message: 'The connection has been removed.',
        })
    },
    onError: (error: { message?: string }) => {
      toast.show({
          title: 'Unable to remove connection',
          message: error.message ?? 'Please try again in a moment.',
          variant: 'error',
        })
    },
  })

  // Follow mutations
  const followMutation = api.follows.followUser.useMutation({
    onMutate: async () => {
      await utils.follows.getFollowing.cancel()
      await utils.follows.getFollowers.cancel()
    },
    onSuccess: () => {
      utils.follows.getFollowing.invalidate()
      utils.follows.getFollowers.invalidate()
      toast.show({
          title: 'Following',
          message: 'You are now following this user.',
        })
    },
    onError: (error: { message?: string }) => {
      toast.show({
          title: 'Unable to follow user',
          message: error.message ?? 'Please try again in a moment.',
          variant: 'error',
        })
    },
  })

  const unfollowMutation = api.follows.unfollowUser.useMutation({
    onMutate: async () => {
      await utils.follows.getFollowing.cancel()
      await utils.follows.getFollowers.cancel()
    },
    onSuccess: () => {
      utils.follows.getFollowing.invalidate()
      utils.follows.getFollowers.invalidate()
      toast.show({
          title: 'Unfollowed',
          message: 'You are no longer following this user.',
        })
    },
    onError: (error: { message?: string }) => {
      toast.show({
          title: 'Unable to unfollow user',
          message: error.message ?? 'Please try again in a moment.',
          variant: 'error',
        })
    },
  })

  // Connection button handlers
  const handleConnect = () => {
    sendRequestMutation.mutate({ targetUserId })
  }

  const handleAcceptRequest = () => {
    if (connectionStatus.connectionId) {
      acceptRequestMutation.mutate({ connectionId: connectionStatus.connectionId })
    }
  }

  const handleDeclineRequest = () => {
    if (connectionStatus.connectionId) {
      declineRequestMutation.mutate({ connectionId: connectionStatus.connectionId })
    }
  }

  const handleRemoveConnection = () => {
    if (connectionStatus.connectionId) {
      removeConnectionMutation.mutate({ connectionId: connectionStatus.connectionId })
    }
  }

  // Follow button handlers
  const handleFollow = () => {
    followMutation.mutate({ targetUserId })
  }

  const handleUnfollow = () => {
    unfollowMutation.mutate({ targetUserId })
  }

  // Determine connection button state
  const connectionButtonState = useMemo(() => {
    if (connectionStatus.isLoading) {
      return { type: 'loading' as const }
    }

    if (connectionStatus.isConnected) {
      return { type: 'connected' as const, connectionId: connectionStatus.connectionId }
    }

    if (connectionStatus.isPending) {
      if (connectionStatus.isSent) {
        return { type: 'pending_sent' as const, connectionId: connectionStatus.connectionId }
      }
      if (connectionStatus.isReceived) {
        return { type: 'pending_received' as const, connectionId: connectionStatus.connectionId }
      }
    }

    return { type: 'none' as const }
  }, [connectionStatus])

  const isConnectionMutating =
    sendRequestMutation.isPending ||
    acceptRequestMutation.isPending ||
    declineRequestMutation.isPending ||
    removeConnectionMutation.isPending

  const isFollowMutating = followMutation.isPending || unfollowMutation.isPending
  const isLoading = connectionStatus.isLoading || followStatus.isLoading

  if (isLoading) {
    return (
      <DashboardWidget>
        <Stack gap="$3" alignItems="center" paddingVertical="$3">
          <Row gap="$2" alignItems="center">
            <Loader2 size={16} color="$color10" />
            <Text fontSize="$3" color="$color10">
              Loading connection status...
            </Text>
          </Row>
        </Stack>
      </DashboardWidget>
    )
  }

  return (
    <DashboardWidget>
      <Stack gap="$3" paddingVertical="$3">
        {/* Connection Button */}
        {connectionButtonState.type === 'connected' && (
          <Row gap="$2" flexWrap="wrap">
            <Button
              size="$4"
              icon={UserCheck}
              theme="success"
              variant="outlined"
              disabled={isConnectionMutating}
              flex={1}
            >
              <Text>Connected</Text>
            </Button>
            <Button
              size="$4"
              icon={UserMinus}
              variant="outlined"
              theme="error"
              onPress={handleRemoveConnection}
              disabled={isConnectionMutating}
            >
              Remove
            </Button>
          </Row>
        )}

        {connectionButtonState.type === 'pending_sent' && (
          <Button
            size="$4"
            icon={Loader2}
            variant="outlined"
            disabled={isConnectionMutating}
            flex={1}
          >
            <Text>Pending</Text>
          </Button>
        )}

        {connectionButtonState.type === 'pending_received' && (
          <Row gap="$2" flexWrap="wrap">
            <Button
              size="$4"
              icon={CheckCircle2}
              theme="success"
              onPress={handleAcceptRequest}
              disabled={isConnectionMutating}
              flex={1}
            >
              <Text>Accept</Text>
            </Button>
            <Button
              size="$4"
              icon={X}
              variant="outlined"
              theme="error"
              onPress={handleDeclineRequest}
              disabled={isConnectionMutating}
            >
              <Text>Decline</Text>
            </Button>
          </Row>
        )}

        {connectionButtonState.type === 'none' && (
          <Button
            size="$4"
            icon={isConnectionMutating ? Loader2 : UserPlus}
            theme="blue"
            onPress={handleConnect}
            disabled={isConnectionMutating}
            flex={1}
          >
            <Text>{isConnectionMutating ? 'Sending...' : 'Connect'}</Text>
          </Button>
        )}

        {/* Follow Button */}
        {!connectionStatus.isConnected && (
          <Button
            size="$4"
            icon={isFollowMutating ? Loader2 : followStatus.isFollowing ? UserMinus : UserPlus}
            variant={followStatus.isFollowing ? 'outlined' : 'outlined'}
            theme={followStatus.isFollowing ? 'error' : 'blue'}
            onPress={followStatus.isFollowing ? handleUnfollow : handleFollow}
            disabled={isFollowMutating || followStatus.isLoading}
            flex={1}
          >
            <Text>
              {isFollowMutating
                ? followStatus.isFollowing
                  ? 'Unfollowing...'
                  : 'Following...'
                : followStatus.isFollowing
                  ? 'Unfollow'
                  : 'Follow'}
            </Text>
          </Button>
        )}
      </Stack>
    </DashboardWidget>
  )
}
