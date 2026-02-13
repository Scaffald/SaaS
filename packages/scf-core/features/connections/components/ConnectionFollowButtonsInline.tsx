import { useConnectionStatus } from '@scf/core/features/user-profile/hooks/useConnectionStatus'
import { useFollowStatus } from '@scf/core/features/user-profile/hooks/useFollowStatus'
import {
  useSendConnectionMutation,
  useAcceptConnectionMutation,
  useDeclineConnectionMutation,
  useRemoveConnectionMutation,
  useFollowUserMutation,
  useUnfollowUserMutation,
} from '@scf/core/utils/engagement-sdk-hooks'
import { CheckCircle2, Loader2, UserCheck, UserMinus, UserPlus, X } from 'lucide-react-native'
import { useToast } from '@unicornlove/beyond-ui'
import { useMemo } from 'react'
import { Button, Text, Row } from '@unicornlove/beyond-ui'
import { useQueryClient } from '@tanstack/react-query'

interface ConnectionFollowButtonsInlineProps {
  targetUserId: string
  isOwnProfile?: boolean
  size?: '$3' | '$4' | '$5'
}

/**
 * ConnectionFollowButtonsInline Component
 * Displays Connect and Follow buttons inline (without DashboardWidget wrapper)
 * Used in profile widgets where buttons need to be integrated into existing layouts
 */
export function ConnectionFollowButtonsInline({
  targetUserId,
  isOwnProfile = false,
  size = '$4',
}: ConnectionFollowButtonsInlineProps) {
  const toast = useToast()
  const queryClient = useQueryClient()

  // Don't show buttons for own profile
  if (isOwnProfile || !targetUserId) {
    return null
  }

  // Connection and follow status hooks
  const connectionStatus = useConnectionStatus(targetUserId)
  const followStatus = useFollowStatus(targetUserId)

  // Connection mutations
  const sendRequestMutation = useSendConnectionMutation({
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['connections', 'list'] })
      await queryClient.cancelQueries({ queryKey: ['connections', 'pending'] })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['connections', 'pending'] })
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

  const acceptRequestMutation = useAcceptConnectionMutation({
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['connections', 'list'] })
      await queryClient.cancelQueries({ queryKey: ['connections', 'pending'] })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['connections', 'pending'] })
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

  const declineRequestMutation = useDeclineConnectionMutation({
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['connections', 'pending'] })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections', 'pending'] })
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

  const removeConnectionMutation = useRemoveConnectionMutation({
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['connections', 'list'] })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections', 'list'] })
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
  const followMutation = useFollowUserMutation({
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['follows', 'following'] })
      await queryClient.cancelQueries({ queryKey: ['follows', 'followers'] })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follows', 'following'] })
      queryClient.invalidateQueries({ queryKey: ['follows', 'followers'] })
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

  const unfollowMutation = useUnfollowUserMutation({
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['follows', 'following'] })
      await queryClient.cancelQueries({ queryKey: ['follows', 'followers'] })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follows', 'following'] })
      queryClient.invalidateQueries({ queryKey: ['follows', 'followers'] })
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
      acceptRequestMutation.mutate(connectionStatus.connectionId)
    }
  }

  const handleDeclineRequest = () => {
    if (connectionStatus.connectionId) {
      declineRequestMutation.mutate(connectionStatus.connectionId)
    }
  }

  const handleRemoveConnection = () => {
    if (connectionStatus.connectionId) {
      removeConnectionMutation.mutate(connectionStatus.connectionId)
    }
  }

  // Follow button handlers
  const handleFollow = () => {
    followMutation.mutate({ targetUserId })
  }

  const handleUnfollow = () => {
    unfollowMutation.mutate(targetUserId)
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
      <Row gap={8} align="center">
        <Loader2 size="md" color="$gray11" />
        <Text color="$gray11">Loading...</Text>
      </Row>
    )
  }

  return (
    <Row gap={8} flexWrap="wrap">
      {/* Connection Button */}
      {connectionButtonState.type === 'connected' && (
        <>
          <Button
            size={size}
            icon={UserCheck}
            theme="success"
            variant="outline"
            disabled={isConnectionMutating}
          >
            <Text>Connected</Text>
          </Button>
          <Button
            size={size}
            icon={UserMinus}
            variant="outline"
            theme="error"
            onPress={handleRemoveConnection}
            disabled={isConnectionMutating}
          >
            <Text>Remove</Text>
          </Button>
        </>
      )}

      {connectionButtonState.type === 'pending_sent' && (
        <Button size={size} icon={Loader2} variant="outline" disabled={isConnectionMutating}>
          <Text>Pending</Text>
        </Button>
      )}

      {connectionButtonState.type === 'pending_received' && (
        <>
          <Button
            size={size}
            icon={CheckCircle2}
            theme="success"
            onPress={handleAcceptRequest}
            disabled={isConnectionMutating}
          >
            <Text>Accept</Text>
          </Button>
          <Button
            size={size}
            icon={X}
            variant="outline"
            theme="error"
            onPress={handleDeclineRequest}
            disabled={isConnectionMutating}
          >
            <Text>Decline</Text>
          </Button>
        </>
      )}

      {connectionButtonState.type === 'none' && (
        <Button
          size={size}
          icon={isConnectionMutating ? Loader2 : UserPlus}
          color="primary"
          onPress={handleConnect}
          disabled={isConnectionMutating}
        >
          <Text>{isConnectionMutating ? 'Sending...' : 'Connect'}</Text>
        </Button>
      )}

      {/* Follow Button */}
      {!connectionStatus.isConnected && (
        <Button
          size={size}
          icon={isFollowMutating ? Loader2 : followStatus.isFollowing ? UserMinus : UserPlus}
          variant="outline"
          theme={followStatus.isFollowing ? 'error' : 'blue'}
          onPress={followStatus.isFollowing ? handleUnfollow : handleFollow}
          disabled={isFollowMutating || followStatus.isLoading}
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
    </Row>
  )
}
