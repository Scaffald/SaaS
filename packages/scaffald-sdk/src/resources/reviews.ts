/**
 * Reviews Resource
 * Peer review system for users and organizations
 */

import { Resource } from './base.js'

// ============================================================================
// Types
// ============================================================================

export interface SoftSkill {
  id: string
  name: string
  category: 'reliability' | 'collaboration' | 'professionalism' | 'technical'
  description?: string | null
  order_index: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Review {
  id: string
  author_user_id: string
  subject_id: string
  subject_type: 'user' | 'organization'
  rating: number | null
  body: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface ReviewWithRelations extends Review {
  review_category_ratings?: ReviewCategoryRating[]
  review_skill_ratings?: ReviewSkillRating[]
  review_soft_skill_votes?: ReviewSoftSkillVote[]
}

export interface ReviewCategoryRating {
  id: string
  review_id: string
  category: 'skills' | 'reliability' | 'collaboration' | 'professionalism' | 'technical'
  rating: number
  created_at: string
}

export interface ReviewSkillRating {
  id: string
  review_id: string
  skill_id: string
  score: number
  created_at: string
}

export interface ReviewSoftSkillVote {
  id: string
  review_id: string
  skill_id: string
  is_strength: boolean
  rating: number | null
  notes: string | null
  created_at: string
}

// ============================================================================
// Request/Response Types
// ============================================================================

export interface GetSoftSkillsParams {
  category?: 'reliability' | 'collaboration' | 'professionalism' | 'technical'
}

export interface GetSoftSkillsResponse {
  skills: SoftSkill[]
}

export interface GetSoftSkillsByCategoryResponse {
  [category: string]: SoftSkill[]
}

export interface CreateReviewDraftParams {
  subjectId: string
  subjectType: 'user' | 'organization'
  context?: string
}

export interface SaveDraftParams {
  reviewId: string
  draft: Record<string, unknown>
}

export interface SaveDraftResponse {
  success: boolean
}

export interface GetDraftParams {
  reviewId: string
}

export interface UpdateStepParams {
  reviewId: string
  step: string
  data: Record<string, unknown>
}

export interface UpdateStepResponse {
  success: boolean
}

export interface UpdateSkillRatingsParams {
  reviewId: string
  ratings: Array<{
    skillId: string
    score: number
  }>
}

export interface UpdateSkillRatingsResponse {
  success: boolean
}

export interface UpdateCategoryRatingParams {
  reviewId: string
  category: 'skills' | 'reliability' | 'collaboration' | 'professionalism' | 'technical'
  rating: number
}

export interface UpdateCategoryRatingResponse {
  success: boolean
}

export interface UpdateSoftSkillVotesParams {
  reviewId: string
  votes: Array<{
    skillId: string
    rating?: number
    isStrength: boolean
    notes?: string
  }>
}

export interface UpdateSoftSkillVotesResponse {
  success: boolean
}

export interface UpdateCommentParams {
  reviewId: string
  comment: string
  isPublic: boolean
}

export interface UpdateCommentResponse {
  success: boolean
}

export interface SubmitReviewParams {
  reviewId: string
  recommendation: number // -1 = do not recommend, 1 = recommend
}

export interface SubmitReviewResponse {
  success: boolean
}

export interface GetReviewsBySubjectParams {
  subjectId: string
  subjectType: 'user' | 'organization'
  status?: 'draft' | 'submitted' | 'released'
}

export interface GetReviewsBySubjectResponse {
  reviews: Array<{
    id: string
    created_at: string
    comment: string | null
    reaction: number | null
    review_category_ratings: ReviewCategoryRating[]
  }>
}

export interface GetMyReviewsResponse {
  reviews: Review[]
}

export interface GetReviewAnalyticsParams {
  subjectId: string
  subjectType?: 'user' | 'organization'
}

export interface ReviewAnalytics {
  overall: {
    totalReviews: number
    recommendCount: number
    notRecommendCount: number
    recommendPercentage: number
  }
  skills: Array<{
    skillId: string
    skillName: string
    averageRating: number
    frequency: number
  }>
  categories: Array<{
    category: string
    averageRating: number
    frequency: number
  }>
  tags: {
    strengths: Array<{
      name: string
      count: number
      category: string
    }>
    improvements: Array<{
      name: string
      count: number
      category: string
    }>
  }
  timeline: Array<{
    month: string
    count: number
    avgRating: number
    totalRating: number
  }>
}

export interface DeleteDraftParams {
  reviewId: string
}

export interface DeleteDraftResponse {
  success: boolean
}

// ============================================================================
// Reviews Resource
// ============================================================================

export class Reviews extends Resource {
  /**
   * Get all soft skills (optionally filtered by category)
   */
  async getSoftSkills(params?: GetSoftSkillsParams): Promise<SoftSkill[]> {
    return this.get('/reviews/soft-skills', params)
  }

  /**
   * Get soft skills grouped by category
   */
  async getSoftSkillsByCategory(): Promise<GetSoftSkillsByCategoryResponse> {
    return this.get('/reviews/soft-skills/by-category')
  }

  /**
   * Create a new review draft
   */
  async createDraft(params: CreateReviewDraftParams): Promise<Review> {
    return this.post('/reviews/drafts', {
      subject_id: params.subjectId,
      subject_type: params.subjectType,
      context: params.context,
    })
  }

  /**
   * Save review draft data (auto-save)
   */
  async saveDraft(params: SaveDraftParams): Promise<SaveDraftResponse> {
    return this.patch(`/reviews/${params.reviewId}/draft`, {
      draft: params.draft,
    })
  }

  /**
   * Get review draft by ID
   */
  async getDraft(params: GetDraftParams): Promise<Review> {
    return this.get(`/reviews/${params.reviewId}/draft`)
  }

  /**
   * Update review progress step
   */
  async updateStep(params: UpdateStepParams): Promise<UpdateStepResponse> {
    return this.patch(`/reviews/${params.reviewId}/step`, {
      step: params.step,
      data: params.data,
    })
  }

  /**
   * Update skill ratings (technical skills)
   */
  async updateSkillRatings(params: UpdateSkillRatingsParams): Promise<UpdateSkillRatingsResponse> {
    return this.patch(`/reviews/${params.reviewId}/skill-ratings`, {
      ratings: params.ratings.map((r) => ({
        skill_id: r.skillId,
        score: r.score,
      })),
    })
  }

  /**
   * Update category rating
   */
  async updateCategoryRating(
    params: UpdateCategoryRatingParams
  ): Promise<UpdateCategoryRatingResponse> {
    return this.patch(`/reviews/${params.reviewId}/category-rating`, {
      category: params.category,
      rating: params.rating,
    })
  }

  /**
   * Update soft skill votes (strengths and improvements)
   */
  async updateSoftSkillVotes(
    params: UpdateSoftSkillVotesParams
  ): Promise<UpdateSoftSkillVotesResponse> {
    return this.patch(`/reviews/${params.reviewId}/soft-skill-votes`, {
      votes: params.votes.map((v) => ({
        skill_id: v.skillId,
        rating: v.rating,
        is_strength: v.isStrength,
        notes: v.notes,
      })),
    })
  }

  /**
   * Update review comment
   */
  async updateComment(params: UpdateCommentParams): Promise<UpdateCommentResponse> {
    return this.patch(`/reviews/${params.reviewId}/comment`, {
      comment: params.comment,
      is_public: params.isPublic,
    })
  }

  /**
   * Submit review
   */
  async submitReview(params: SubmitReviewParams): Promise<SubmitReviewResponse> {
    return this.post(`/reviews/${params.reviewId}/submit`, {
      recommendation: params.recommendation,
    })
  }

  /**
   * Get reviews by subject (user or organization)
   */
  async getBySubject(
    params: GetReviewsBySubjectParams
  ): Promise<GetReviewsBySubjectResponse['reviews']> {
    const result = await this.get<GetReviewsBySubjectResponse['reviews']>('/reviews/by-subject', {
      subject_id: params.subjectId,
      subject_type: params.subjectType,
      status: params.status,
    })
    return result
  }

  /**
   * Get user's own reviews (drafts and submitted)
   */
  async getMyReviews(): Promise<Review[]> {
    return this.get('/reviews/my-reviews')
  }

  /**
   * Get aggregated review analytics for a subject
   */
  async getReviewAnalytics(
    params: GetReviewAnalyticsParams
  ): Promise<ReviewAnalytics | null> {
    return this.get('/reviews/analytics', {
      subject_id: params.subjectId,
      subject_type: params.subjectType ?? 'user',
    })
  }

  /**
   * Delete review draft
   */
  async deleteDraft(params: DeleteDraftParams): Promise<DeleteDraftResponse> {
    return this.del(`/reviews/${params.reviewId}/draft`)
  }
}
