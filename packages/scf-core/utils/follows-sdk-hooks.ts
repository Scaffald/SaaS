/**
 * Follows SDK hooks. Use these instead of api.follows.* when migrating to REST/SDK.
 * Requires ScaffaldJobsSdkProviderFromSession (client from context).
 */

import { useMutation, useQuery, type UseMutationOptions } from '@tanstack/react-query'
import { useScaffaldJobsClient } from './jobs-sdk-context'
import type { Follow, FollowUserParams } from '@scaffald/sdk/resources/follows'

// ============================================================================
// QUERY HOOKS
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

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/** Follow a user */
export function useFollowUserMutation(options?: UseMutationOptions<Follow, Error, FollowUserParams>) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (params: FollowUserParams) => {
      if (!client) throw new Error('Missing client')
      return client.follows.followUser(params)
    },
    ...options,
  })
}

/** Unfollow a user */
export function useUnfollowUserMutation(options?: UseMutationOptions<void, Error, string>) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (userId: string) => {
      if (!client) throw new Error('Missing client')
      return client.follows.unfollowUser(userId)
    },
    ...options,
  })
}
