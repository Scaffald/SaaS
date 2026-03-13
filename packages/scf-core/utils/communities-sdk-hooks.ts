/**
 * Communities SDK hooks. Provides React Query wrappers for all community features:
 * communities, posts, comments, ratings, interactions, reputation, and skills.
 */

import {
  useMutation,
  useQuery,
  useInfiniteQuery,
  type UseMutationOptions,
} from '@tanstack/react-query'
import { useScaffaldJobsClient } from './jobs-sdk-context'
import type { Membership, JoinCommunityParams } from '@scaffald/sdk/resources/communities'
import type {
  CommunityPost,
  CreatePostParams,
  UpdatePostParams,
  FeedParams,
  FeedResponse,
} from '@scaffald/sdk/resources/community-posts'
import type {
  CommunityComment,
  CreateCommentParams,
} from '@scaffald/sdk/resources/community-comments'
import type { PostRating, CreateRatingParams } from '@scaffald/sdk/resources/community-ratings'
import type { UpvoteParams, Bookmark } from '@scaffald/sdk/resources/community-interactions'
import type { GiftKarmaParams } from '@scaffald/sdk/resources/community-reputation'
import type { SkillSearchParams } from '@scaffald/sdk/resources/community-skills'

// ============================================================================
// COMMUNITIES — Query Hooks
// ============================================================================

export function useCommunities(options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['communities', 'list'],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.communities.list()
    },
    enabled: !!client && options?.enabled !== false,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCommunity(slug: string | undefined, options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['communities', 'detail', slug],
    queryFn: async () => {
      if (!client || !slug) throw new Error('Missing client or slug')
      return client.communities.getBySlug(slug)
    },
    enabled: !!client && !!slug && options?.enabled !== false,
    staleTime: 2 * 60 * 1000,
  })
}

export function useCommunityMembers(
  communityId: string | undefined,
  params?: { limit?: number; offset?: number },
  options?: { enabled?: boolean }
) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['communities', 'members', communityId, params],
    queryFn: async () => {
      if (!client || !communityId) throw new Error('Missing client or communityId')
      return client.communities.getMembers(communityId, params)
    },
    enabled: !!client && !!communityId && options?.enabled !== false,
    staleTime: 2 * 60 * 1000,
  })
}

export function useMyCommunities(options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['communities', 'my'],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.communities.myCommunities()
    },
    enabled: !!client && options?.enabled !== false,
    staleTime: 2 * 60 * 1000,
  })
}

// ============================================================================
// COMMUNITIES — Mutation Hooks
// ============================================================================

export function useJoinCommunityMutation(
  options?: UseMutationOptions<
    { data: Membership },
    Error,
    { communityId: string; params?: JoinCommunityParams }
  >
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async ({
      communityId,
      params,
    }: {
      communityId: string
      params?: JoinCommunityParams
    }) => {
      if (!client) throw new Error('Missing client')
      return client.communities.join(communityId, params)
    },
    ...options,
  })
}

export function useLeaveCommunityMutation(options?: UseMutationOptions<void, Error, string>) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (communityId: string) => {
      if (!client) throw new Error('Missing client')
      return client.communities.leave(communityId)
    },
    ...options,
  })
}

// ============================================================================
// POSTS — Query Hooks
// ============================================================================

export function useCommunityFeed(
  communityId: string | undefined,
  params?: Omit<FeedParams, 'cursor'>,
  options?: { enabled?: boolean }
) {
  const client = useScaffaldJobsClient()
  return useInfiniteQuery({
    queryKey: ['communities', 'feed', communityId, params],
    queryFn: async ({ pageParam }: { pageParam: string | undefined }) => {
      if (!client || !communityId) throw new Error('Missing client or communityId')
      return client.communityPosts.getCommunityFeed(communityId, {
        ...params,
        cursor: pageParam,
      })
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: FeedResponse) => lastPage.next_cursor ?? undefined,
    enabled: !!client && !!communityId && options?.enabled !== false,
    staleTime: 1 * 60 * 1000,
  })
}

export function usePublishedFeed(
  params?: Omit<FeedParams, 'cursor'>,
  options?: { enabled?: boolean }
) {
  const client = useScaffaldJobsClient()
  return useInfiniteQuery({
    queryKey: ['communities', 'published-feed', params],
    queryFn: async ({ pageParam }: { pageParam: string | undefined }) => {
      if (!client) throw new Error('Missing client')
      return client.communityPosts.getPublishedFeed({
        ...params,
        cursor: pageParam,
      })
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: FeedResponse) => lastPage.next_cursor ?? undefined,
    enabled: !!client && options?.enabled !== false,
    staleTime: 1 * 60 * 1000,
  })
}

export function useUserPortfolio(
  userId: string | undefined,
  params?: { limit?: number },
  options?: { enabled?: boolean }
) {
  const client = useScaffaldJobsClient()
  return useInfiniteQuery({
    queryKey: ['communities', 'portfolio', userId, params],
    queryFn: async ({ pageParam }: { pageParam: string | undefined }) => {
      if (!client || !userId) throw new Error('Missing client or userId')
      return client.communityPosts.getUserPortfolio(userId, {
        ...params,
        cursor: pageParam,
      })
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: FeedResponse) => lastPage.next_cursor ?? undefined,
    enabled: !!client && !!userId && options?.enabled !== false,
    staleTime: 2 * 60 * 1000,
  })
}

export function usePost(postId: string | undefined, options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['communities', 'post', postId],
    queryFn: async () => {
      if (!client || !postId) throw new Error('Missing client or postId')
      return client.communityPosts.getPost(postId)
    },
    enabled: !!client && !!postId && options?.enabled !== false,
    staleTime: 1 * 60 * 1000,
  })
}

// ============================================================================
// POSTS — Mutation Hooks
// ============================================================================

export function useCreatePostMutation(
  options?: UseMutationOptions<{ data: CommunityPost }, Error, CreatePostParams>
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (params: CreatePostParams) => {
      if (!client) throw new Error('Missing client')
      return client.communityPosts.create(params)
    },
    ...options,
  })
}

export function useUpdatePostMutation(
  options?: UseMutationOptions<
    { data: CommunityPost },
    Error,
    { postId: string; params: UpdatePostParams }
  >
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async ({ postId, params }: { postId: string; params: UpdatePostParams }) => {
      if (!client) throw new Error('Missing client')
      return client.communityPosts.update(postId, params)
    },
    ...options,
  })
}

export function useSubmitPostMutation(
  options?: UseMutationOptions<{ data: CommunityPost }, Error, string>
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (postId: string) => {
      if (!client) throw new Error('Missing client')
      return client.communityPosts.submit(postId)
    },
    ...options,
  })
}

export function usePublishPostMutation(
  options?: UseMutationOptions<{ data: CommunityPost }, Error, string>
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (postId: string) => {
      if (!client) throw new Error('Missing client')
      return client.communityPosts.publish(postId)
    },
    ...options,
  })
}

export function useUnpublishPostMutation(
  options?: UseMutationOptions<{ data: CommunityPost }, Error, string>
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (postId: string) => {
      if (!client) throw new Error('Missing client')
      return client.communityPosts.unpublish(postId)
    },
    ...options,
  })
}

export function useDeletePostMutation(options?: UseMutationOptions<void, Error, string>) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (postId: string) => {
      if (!client) throw new Error('Missing client')
      return client.communityPosts.delete(postId)
    },
    ...options,
  })
}

// ============================================================================
// COMMENTS — Query Hooks
// ============================================================================

export function usePostComments(
  postId: string | undefined,
  params?: { limit?: number; offset?: number },
  options?: { enabled?: boolean }
) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['communities', 'comments', postId, params],
    queryFn: async () => {
      if (!client || !postId) throw new Error('Missing client or postId')
      return client.communityComments.list(postId, params)
    },
    enabled: !!client && !!postId && options?.enabled !== false,
    staleTime: 30 * 1000,
  })
}

// ============================================================================
// COMMENTS — Mutation Hooks
// ============================================================================

export function useCreateCommentMutation(
  options?: UseMutationOptions<
    { data: CommunityComment },
    Error,
    { postId: string; params: CreateCommentParams }
  >
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async ({ postId, params }: { postId: string; params: CreateCommentParams }) => {
      if (!client) throw new Error('Missing client')
      return client.communityComments.create(postId, params)
    },
    ...options,
  })
}

export function useEditCommentMutation(
  options?: UseMutationOptions<
    { data: CommunityComment },
    Error,
    { commentId: string; body: string }
  >
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async ({ commentId, body }: { commentId: string; body: string }) => {
      if (!client) throw new Error('Missing client')
      return client.communityComments.edit(commentId, body)
    },
    ...options,
  })
}

export function useDeleteCommentMutation(options?: UseMutationOptions<void, Error, string>) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (commentId: string) => {
      if (!client) throw new Error('Missing client')
      return client.communityComments.delete(commentId)
    },
    ...options,
  })
}

export function usePinCommentMutation(
  options?: UseMutationOptions<{ data: CommunityComment }, Error, string>
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (commentId: string) => {
      if (!client) throw new Error('Missing client')
      return client.communityComments.pin(commentId)
    },
    ...options,
  })
}

export function useUnpinCommentMutation(options?: UseMutationOptions<void, Error, string>) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (commentId: string) => {
      if (!client) throw new Error('Missing client')
      return client.communityComments.unpin(commentId)
    },
    ...options,
  })
}

// ============================================================================
// RATINGS — Query Hooks
// ============================================================================

export function usePostRatings(postId: string | undefined, options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['communities', 'ratings', postId],
    queryFn: async () => {
      if (!client || !postId) throw new Error('Missing client or postId')
      return client.communityRatings.list(postId)
    },
    enabled: !!client && !!postId && options?.enabled !== false,
    staleTime: 1 * 60 * 1000,
  })
}

export function usePostRatingsSummary(postId: string | undefined, options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['communities', 'ratings', 'summary', postId],
    queryFn: async () => {
      if (!client || !postId) throw new Error('Missing client or postId')
      return client.communityRatings.getSummary(postId)
    },
    enabled: !!client && !!postId && options?.enabled !== false,
    staleTime: 1 * 60 * 1000,
  })
}

// ============================================================================
// RATINGS — Mutation Hooks
// ============================================================================

export function useRatePostMutation(
  options?: UseMutationOptions<
    { data: PostRating },
    Error,
    { postId: string; params: CreateRatingParams }
  >
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async ({ postId, params }: { postId: string; params: CreateRatingParams }) => {
      if (!client) throw new Error('Missing client')
      return client.communityRatings.rate(postId, params)
    },
    ...options,
  })
}

// ============================================================================
// INTERACTIONS — Query Hooks
// ============================================================================

export function useBookmarks(params?: { limit?: number }, options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useInfiniteQuery({
    queryKey: ['communities', 'bookmarks', params],
    queryFn: async ({ pageParam }: { pageParam: string | undefined }) => {
      if (!client) throw new Error('Missing client')
      return client.communityInteractions.listBookmarks({
        ...params,
        cursor: pageParam,
      })
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    enabled: !!client && options?.enabled !== false,
    staleTime: 2 * 60 * 1000,
  })
}

// ============================================================================
// INTERACTIONS — Mutation Hooks
// ============================================================================

export function useUpvoteMutation(
  options?: UseMutationOptions<{ success: boolean }, Error, UpvoteParams>
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (params: UpvoteParams) => {
      if (!client) throw new Error('Missing client')
      return client.communityInteractions.upvote(params)
    },
    ...options,
  })
}

export function useRemoveUpvoteMutation(
  options?: UseMutationOptions<void, Error, { targetType: 'post' | 'comment'; targetId: string }>
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async ({
      targetType,
      targetId,
    }: {
      targetType: 'post' | 'comment'
      targetId: string
    }) => {
      if (!client) throw new Error('Missing client')
      return client.communityInteractions.removeUpvote(targetType, targetId)
    },
    ...options,
  })
}

export function useBookmarkMutation(
  options?: UseMutationOptions<{ data: Bookmark }, Error, string>
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (postId: string) => {
      if (!client) throw new Error('Missing client')
      return client.communityInteractions.bookmark(postId)
    },
    ...options,
  })
}

export function useRemoveBookmarkMutation(options?: UseMutationOptions<void, Error, string>) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (postId: string) => {
      if (!client) throw new Error('Missing client')
      return client.communityInteractions.removeBookmark(postId)
    },
    ...options,
  })
}

// ============================================================================
// REPUTATION — Query Hooks
// ============================================================================

export function useScaffoldScore(options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['communities', 'reputation', 'me'],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.communityReputation.getMyScore()
    },
    enabled: !!client && options?.enabled !== false,
    staleTime: 1 * 60 * 1000,
  })
}

export function useUserScaffoldScore(userId: string | undefined, options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['communities', 'reputation', 'user', userId],
    queryFn: async () => {
      if (!client || !userId) throw new Error('Missing client or userId')
      return client.communityReputation.getUserScore(userId)
    },
    enabled: !!client && !!userId && options?.enabled !== false,
    staleTime: 2 * 60 * 1000,
  })
}

export function useReputationHistory(
  params?: { limit?: number; offset?: number },
  options?: { enabled?: boolean }
) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['communities', 'reputation', 'history', params],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.communityReputation.getHistory(params)
    },
    enabled: !!client && options?.enabled !== false,
    staleTime: 1 * 60 * 1000,
  })
}

// ============================================================================
// REPUTATION — Mutation Hooks
// ============================================================================

export function useGiftKarmaMutation(
  options?: UseMutationOptions<{ success: boolean; message: string }, Error, GiftKarmaParams>
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (params: GiftKarmaParams) => {
      if (!client) throw new Error('Missing client')
      return client.communityReputation.giftKarma(params)
    },
    ...options,
  })
}

// ============================================================================
// SKILLS — Query Hooks
// ============================================================================

export function useSkillSearch(
  params: SkillSearchParams | undefined,
  options?: { enabled?: boolean }
) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['communities', 'skills', 'search', params],
    queryFn: async () => {
      if (!client || !params) throw new Error('Missing client or params')
      return client.communitySkills.search(params)
    },
    enabled: !!client && !!params?.q && options?.enabled !== false,
    staleTime: 5 * 60 * 1000,
  })
}

export function useSkillTree(communityId: string | undefined, options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['communities', 'skills', 'tree', communityId],
    queryFn: async () => {
      if (!client || !communityId) throw new Error('Missing client or communityId')
      return client.communitySkills.getTree(communityId)
    },
    enabled: !!client && !!communityId && options?.enabled !== false,
    staleTime: 10 * 60 * 1000,
  })
}

export function useSkillChildren(skillId: string | undefined, options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['communities', 'skills', 'children', skillId],
    queryFn: async () => {
      if (!client || !skillId) throw new Error('Missing client or skillId')
      return client.communitySkills.getChildren(skillId)
    },
    enabled: !!client && !!skillId && options?.enabled !== false,
    staleTime: 5 * 60 * 1000,
  })
}

export function useSkillAncestors(skillId: string | undefined, options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['communities', 'skills', 'ancestors', skillId],
    queryFn: async () => {
      if (!client || !skillId) throw new Error('Missing client or skillId')
      return client.communitySkills.getAncestors(skillId)
    },
    enabled: !!client && !!skillId && options?.enabled !== false,
    staleTime: 10 * 60 * 1000,
  })
}
