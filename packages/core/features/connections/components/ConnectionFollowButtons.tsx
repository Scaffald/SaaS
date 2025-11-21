import { useConnectionStatus } from '@app/core/features/user-profile/hooks/useConnectionStatus'
import { useFollowStatus } from '@app/core/features/user-profile/hooks/useFollowStatus'
import { api } from '@app/core/utils/api'
import { DashboardWidget } from '@app/ui'
import {
  CheckCircle2,
  Loader2,
  UserCheck,
  UserMinus,
  UserPlus,
  X,
} from '@tamagui/lucide-icons'
import { useToastController } from '@tamagui/toast'
import { useMemo } from 'react'
import { Button, Text, XStack, YStack } from 'tamagui'

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
  const toast = useToastController()
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
      toast.show('Connection request sent', {
        message: 'Your connection request has been sent.',
      })
    },
    onError: (error: { message?: string }) => {
      toast.show('Unable to send request', {
        message: error.message ?? 'Please try again in a moment.',
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
      toast.show('Connection accepted', {
        message: 'You are now connected.',
      })
    },
    onError: (error: { message?: string }) => {
      toast.show('Unable to accept request', {
        message: error.message ?? 'Please try again in a moment.',
      })
    },
  })

  const declineRequestMutation = api.connections.declineRequest.useMutation({
    onMutate: async () => {
      await utils.connections.getPendingRequests.cancel()
    },
    onSuccess: () => {
      utils.connections.getPendingRequests.invalidate()
      toast.show('Connection request declined', {
        message: 'The connection request has been declined.',
      })
    },
    onError: (error: { message?: string }) => {
      toast.show('Unable to decline request', {
        message: error.message ?? 'Please try again in a moment.',
      })
    },
  })

  const removeConnectionMutation = api.connections.removeConnection.useMutation({
    onMutate: async () => {
      await utils.connections.getConnections.cancel()
    },
    onSuccess: () => {
      utils.connections.getConnections.invalidate()
      toast.show('Connection removed', {
        message: 'The connection has been removed.',
      })
    },
    onError: (error: { message?: string }) => {
      toast.show('Unable to remove connection', {
        message: error.message ?? 'Please try again in a moment.',
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
      toast.show('Following', {
        message: 'You are now following this user.',
      })
    },
    onError: (error: { message?: string }) => {
      toast.show('Unable to follow user', {
        message: error.message ?? 'Please try again in a moment.',
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
      toast.show('Unfollowed', {
        message: 'You are no longer following this user.',
      })
    },
    onError: (error: { message?: string }) => {
      toast.show('Unable to unfollow user', {
        message: error.message ?? 'Please try again in a moment.',
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
    sendRequestMutation.isLoading ||
    acceptRequestMutation.isLoading ||
    declineRequestMutation.isLoading ||
    removeConnectionMutation.isLoading

  const isFollowMutating = followMutation.isLoading || unfollowMutation.isLoading
  const isLoading = connectionStatus.isLoading || followStatus.isLoading

  if (isLoading) {
    return (
      <DashboardWidget>
        <YStack gap="$3" items="center" py="$3">
          <XStack gap="$2" items="center">
            <Loader2 size={16} color="$color10" />
            <Text fontSize="$3" color="$color10">
              Loading connection status...
            </Text>
          </XStack>
        </YStack>
      </DashboardWidget>
    )
  }

  return (
    <DashboardWidget>
      <YStack gap="$3" py="$3">
        {/* Connection Button */}
        {connectionButtonState.type === 'connected' && (
          <XStack gap="$2" flexWrap="wrap">
            <Button
              size="$4"
              icon={UserCheck}
              theme="green"
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
              theme="red"
              onPress={handleRemoveConnection}
              disabled={isConnectionMutating}
            >
              Remove
            </Button>
          </XStack>
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
          <XStack gap="$2" flexWrap="wrap">
            <Button
              size="$4"
              icon={CheckCircle2}
              theme="green"
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
              theme="red"
              onPress={handleDeclineRequest}
              disabled={isConnectionMutating}
            >
              <Text>Decline</Text>
            </Button>
          </XStack>
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
            theme={followStatus.isFollowing ? 'red' : 'blue'}
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
      </YStack>
    </DashboardWidget>
  )
}
