/**
 * Engagement SDK hooks (connections, follows, engagement tracking).
 * Use these instead of api.connections.*, api.follows.*, api.engagement.* when migrating to REST/SDK.
 * Requires ScaffaldJobsSdkProviderFromSession (client from context).
 */

import { useMutation, useQuery, type UseMutationOptions } from '@tanstack/react-query'
import { useScaffaldJobsClient } from './jobs-sdk-context'

// ============================================================================
// CONNECTIONS HOOKS
// ============================================================================

/** Get all accepted connections for the current user */
export function useConnections(options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['connections', 'list'],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.connections.list()
    },
    enabled: !!client && (options?.enabled !== false),
    staleTime: 2 * 60 * 1000,
  })
}

/** Get pending connection requests (sent and received) */
export function usePendingConnections(options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['connections', 'pending'],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.connections.getPending()
    },
    enabled: !!client && (options?.enabled !== false),
    staleTime: 1 * 60 * 1000, // 1 minute - more frequent since these are real-time
  })
}

/** Get connection status with a specific user */
export function useConnectionStatus(userId: string | undefined, options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['connections', 'status', userId],
    queryFn: async () => {
      if (!client || !userId) throw new Error('Missing client or userId')
      return client.connections.getStatus(userId)
    },
    enabled: !!client && !!userId && (options?.enabled !== false),
    staleTime: 1 * 60 * 1000,
  })
}

/** Send a connection request to another user */
export function useSendConnectionMutation(options?: UseMutationOptions<any, any, { targetUserId: string }>) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (params: { targetUserId: string }) => {
      if (!client) throw new Error('Missing client')
      return client.connections.send(params)
    },
    ...options,
  })
}

/** Accept a connection request */
export function useAcceptConnectionMutation(options?: UseMutationOptions<any, any, string>) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (connectionId: string) => {
      if (!client) throw new Error('Missing client')
      return client.connections.accept(connectionId)
    },
    ...options,
  })
}

/** Decline a connection request */
export function useDeclineConnectionMutation(options?: UseMutationOptions<any, any, string>) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (connectionId: string) => {
      if (!client) throw new Error('Missing client')
      return client.connections.decline(connectionId)
    },
    ...options,
  })
}

/** Remove an existing connection */
export function useRemoveConnectionMutation(options?: UseMutationOptions<any, any, string>) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (connectionId: string) => {
      if (!client) throw new Error('Missing client')
      return client.connections.remove(connectionId)
    },
    ...options,
  })
}

/** Cancel a sent connection request */
export function useCancelConnectionMutation(options?: UseMutationOptions<any, any, string>) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (connectionId: string) => {
      if (!client) throw new Error('Missing client')
      return client.connections.cancel(connectionId)
    },
    ...options,
  })
}

// ============================================================================
// FOLLOWS HOOKS
// ============================================================================

/** Get users that the current user is following */
export function useFollowing(
  params?: { limit?: number; offset?: number },
  options?: { enabled?: boolean }
) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['follows', 'following', params],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.follows.getFollowing(params)
    },
    enabled: !!client && (options?.enabled !== false),
    staleTime: 2 * 60 * 1000,
  })
}

/** Get users following the current user */
export function useFollowers(
  params?: { limit?: number; offset?: number },
  options?: { enabled?: boolean }
) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['follows', 'followers', params],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.follows.getFollowers(params)
    },
    enabled: !!client && (options?.enabled !== false),
    staleTime: 2 * 60 * 1000,
  })
}

/** Check if current user is following another user */
export function useFollowStatus(userId: string | undefined, options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['follows', 'status', userId],
    queryFn: async () => {
      if (!client || !userId) throw new Error('Missing client or userId')
      return client.follows.getStatus(userId)
    },
    enabled: !!client && !!userId && (options?.enabled !== false),
    staleTime: 1 * 60 * 1000,
  })
}

/** Follow a user */
export function useFollowUserMutation(options?: UseMutationOptions<any, any, { targetUserId: string }>) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (params: { targetUserId: string }) => {
      if (!client) throw new Error('Missing client')
      return client.follows.followUser(params)
    },
    ...options,
  })
}

/** Unfollow a user */
export function useUnfollowUserMutation(options?: UseMutationOptions<any, any, string>) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (userId: string) => {
      if (!client) throw new Error('Missing client')
      return client.follows.unfollowUser(userId)
    },
    ...options,
  })
}

// ============================================================================
// ENGAGEMENT TRACKING HOOKS
// ============================================================================

/** Track an engagement event */
export function useTrackEngagementMutation(options?: UseMutationOptions<any, any, any>) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (params: any) => {
      if (!client) throw new Error('Missing client')
      return client.engagement.track(params)
    },
    ...options,
  })
}

/** Get recent activity for the current user */
export function useRecentActivity(
  params?: { limit?: number; eventTypes?: string[] },
  options?: { enabled?: boolean }
) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['engagement', 'activity', params],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.engagement.getRecentActivity(params)
    },
    enabled: !!client && (options?.enabled !== false),
    staleTime: 1 * 60 * 1000,
  })
}

/** Get engagement metrics for the current user */
export function useEngagementMetrics(params?: { days?: number }, options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['engagement', 'metrics', params],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.engagement.getMetrics(params)
    },
    enabled: !!client && (options?.enabled !== false),
    staleTime: 5 * 60 * 1000,
  })
}
