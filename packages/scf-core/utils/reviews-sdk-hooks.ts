/**
 * Reviews SDK Hooks
 * React Query hooks for peer review operations
 */

import {
  useMutation,
  useQuery,
  type UseMutationOptions,
  type UseQueryOptions,
} from '@tanstack/react-query'
import { useScaffaldJobsClient } from './jobs-sdk-context'
import type {
  SoftSkill,
  Review,
  ReviewAnalytics,
  GetSoftSkillsParams,
  GetSoftSkillsByCategoryResponse,
  CreateReviewDraftParams,
  SaveDraftParams,
  SaveDraftResponse,
  GetDraftParams,
  UpdateStepParams,
  UpdateStepResponse,
  UpdateSkillRatingsParams,
  UpdateSkillRatingsResponse,
  UpdateCategoryRatingParams,
  UpdateCategoryRatingResponse,
  UpdateSoftSkillVotesParams,
  UpdateSoftSkillVotesResponse,
  UpdateCommentParams,
  UpdateCommentResponse,
  SubmitReviewParams,
  SubmitReviewResponse,
  GetReviewsBySubjectParams,
  GetReviewAnalyticsParams,
  DeleteDraftParams,
  DeleteDraftResponse,
} from '@scaffald/sdk'

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Get soft skills (optionally filtered by category)
 */
export function useSoftSkills(
  params?: GetSoftSkillsParams,
  options?: Omit<UseQueryOptions<SoftSkill[]>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()

  return useQuery({
    queryKey: ['scaffald', 'reviews', 'soft-skills', params],
    queryFn: async () => {
      if (!client) throw new Error('Scaffald client not available')
      return client.reviews.getSoftSkills(params)
    },
    enabled: !!client && (options?.enabled ?? true),
    ...options,
  })
}

/**
 * Get soft skills grouped by category
 */
export function useSoftSkillsByCategory(
  options?: Omit<UseQueryOptions<GetSoftSkillsByCategoryResponse>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()

  return useQuery({
    queryKey: ['scaffald', 'reviews', 'soft-skills', 'by-category'],
    queryFn: async () => {
      if (!client) throw new Error('Scaffald client not available')
      return client.reviews.getSoftSkillsByCategory()
    },
    enabled: !!client && (options?.enabled ?? true),
    ...options,
  })
}

/**
 * Get review draft by ID
 */
export function useReviewDraft(
  params: GetDraftParams,
  options?: Omit<UseQueryOptions<Review>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()

  return useQuery({
    queryKey: ['scaffald', 'reviews', 'draft', params.reviewId],
    queryFn: async () => {
      if (!client) throw new Error('Scaffald client not available')
      return client.reviews.getDraft(params)
    },
    enabled: !!client && !!params.reviewId && (options?.enabled ?? true),
    ...options,
  })
}

/**
 * Get reviews by subject (user or organization)
 */
export function useReviewsBySubject(
  params: GetReviewsBySubjectParams,
  options?: Omit<
    UseQueryOptions<
      Array<{
        id: string
        created_at: string
        comment: string | null
        reaction: number | null
        review_category_ratings: Array<{ category: string; rating: number }>
      }>
    >,
    'queryKey' | 'queryFn'
  >
) {
  const client = useScaffaldJobsClient()

  return useQuery({
    queryKey: ['scaffald', 'reviews', 'by-subject', params],
    queryFn: async () => {
      if (!client) throw new Error('Scaffald client not available')
      return client.reviews.getBySubject(params)
    },
    enabled: !!client && !!params.subjectId && (options?.enabled ?? true),
    ...options,
  })
}

/**
 * Get user's own reviews
 */
export function useMyReviews(options?: Omit<UseQueryOptions<Review[]>, 'queryKey' | 'queryFn'>) {
  const client = useScaffaldJobsClient()

  return useQuery({
    queryKey: ['scaffald', 'reviews', 'my-reviews'],
    queryFn: async () => {
      if (!client) throw new Error('Scaffald client not available')
      return client.reviews.getMyReviews()
    },
    enabled: !!client && (options?.enabled ?? true),
    ...options,
  })
}

/**
 * Get aggregated review analytics
 */
export function useReviewAnalytics(
  params: GetReviewAnalyticsParams,
  options?: Omit<UseQueryOptions<ReviewAnalytics | null>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()

  return useQuery({
    queryKey: ['scaffald', 'reviews', 'analytics', params],
    queryFn: async () => {
      if (!client) throw new Error('Scaffald client not available')
      return client.reviews.getReviewAnalytics(params)
    },
    enabled: !!client && !!params.subjectId && (options?.enabled ?? true),
    ...options,
  })
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Create a new review draft
 */
export function useCreateReviewDraftMutation(
  options?: UseMutationOptions<Review, Error, CreateReviewDraftParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: CreateReviewDraftParams) => {
      if (!client) throw new Error('Scaffald client not available')
      return client.reviews.createDraft(params)
    },
    ...options,
  })
}

/**
 * Save review draft (auto-save)
 */
export function useSaveDraftMutation(
  options?: UseMutationOptions<SaveDraftResponse, Error, SaveDraftParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: SaveDraftParams) => {
      if (!client) throw new Error('Scaffald client not available')
      return client.reviews.saveDraft(params)
    },
    ...options,
  })
}

/**
 * Update review progress step
 */
export function useUpdateStepMutation(
  options?: UseMutationOptions<UpdateStepResponse, Error, UpdateStepParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: UpdateStepParams) => {
      if (!client) throw new Error('Scaffald client not available')
      return client.reviews.updateStep(params)
    },
    ...options,
  })
}

/**
 * Update skill ratings
 */
export function useUpdateSkillRatingsMutation(
  options?: UseMutationOptions<UpdateSkillRatingsResponse, Error, UpdateSkillRatingsParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: UpdateSkillRatingsParams) => {
      if (!client) throw new Error('Scaffald client not available')
      return client.reviews.updateSkillRatings(params)
    },
    ...options,
  })
}

/**
 * Update category rating
 */
export function useUpdateCategoryRatingMutation(
  options?: UseMutationOptions<UpdateCategoryRatingResponse, Error, UpdateCategoryRatingParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: UpdateCategoryRatingParams) => {
      if (!client) throw new Error('Scaffald client not available')
      return client.reviews.updateCategoryRating(params)
    },
    ...options,
  })
}

/**
 * Update soft skill votes
 */
export function useUpdateSoftSkillVotesMutation(
  options?: UseMutationOptions<UpdateSoftSkillVotesResponse, Error, UpdateSoftSkillVotesParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: UpdateSoftSkillVotesParams) => {
      if (!client) throw new Error('Scaffald client not available')
      return client.reviews.updateSoftSkillVotes(params)
    },
    ...options,
  })
}

/**
 * Update review comment
 */
export function useUpdateCommentMutation(
  options?: UseMutationOptions<UpdateCommentResponse, Error, UpdateCommentParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: UpdateCommentParams) => {
      if (!client) throw new Error('Scaffald client not available')
      return client.reviews.updateComment(params)
    },
    ...options,
  })
}

/**
 * Submit review
 */
export function useSubmitReviewMutation(
  options?: UseMutationOptions<SubmitReviewResponse, Error, SubmitReviewParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: SubmitReviewParams) => {
      if (!client) throw new Error('Scaffald client not available')
      return client.reviews.submitReview(params)
    },
    ...options,
  })
}

/**
 * Delete review draft
 */
export function useDeleteDraftMutation(
  options?: UseMutationOptions<DeleteDraftResponse, Error, DeleteDraftParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: DeleteDraftParams) => {
      if (!client) throw new Error('Scaffald client not available')
      return client.reviews.deleteDraft(params)
    },
    ...options,
  })
}
