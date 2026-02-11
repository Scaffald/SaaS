import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { Scaffald } from '../client.js'
import { server } from './mocks/server.js'
import { http, HttpResponse } from 'msw'

describe('Reviews', () => {
  let client: Scaffald

  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' })
    client = new Scaffald({
      apiKey: 'test_key',
      baseUrl: 'https://api.scaffald.com',
    })
  })

  afterEach(() => {
    server.resetHandlers()
  })

  afterAll(() => {
    server.close()
  })

  // ===== Soft Skills =====

  describe('getSoftSkills()', () => {
    it('should get all soft skills', async () => {
      const result = await client.reviews.getSoftSkills()

      expect(result).toBeDefined()
      expect(result).toBeInstanceOf(Array)
    })

    it('should filter soft skills by category', async () => {
      const result = await client.reviews.getSoftSkills({ category: 'reliability' })

      expect(result).toBeDefined()
      expect(result).toBeInstanceOf(Array)
    })

    it('should include soft skill details', async () => {
      const result = await client.reviews.getSoftSkills()

      if (result.length > 0) {
        const skill = result[0]
        expect(skill.id).toBeDefined()
        expect(skill.name).toBeDefined()
        expect(skill.category).toBeDefined()
        expect(['reliability', 'collaboration', 'professionalism', 'technical']).toContain(
          skill.category
        )
      }
    })
  })

  describe('getSoftSkillsByCategory()', () => {
    it('should get soft skills grouped by category', async () => {
      const result = await client.reviews.getSoftSkillsByCategory()

      expect(result).toBeDefined()
      expect(typeof result).toBe('object')
    })

    it('should include all categories', async () => {
      const result = await client.reviews.getSoftSkillsByCategory()

      const categories = Object.keys(result)
      expect(categories.length).toBeGreaterThan(0)
    })
  })

  // ===== Review Drafts =====

  describe('createDraft()', () => {
    it('should create a review draft', async () => {
      const result = await client.reviews.createDraft({
        subjectId: 'user_123',
        subjectType: 'user',
      })

      expect(result).toBeDefined()
      expect(result.id).toBeDefined()
      expect(result.subject_id).toBe('user_123')
      expect(result.subject_type).toBe('user')
    })

    it('should create organization review draft', async () => {
      const result = await client.reviews.createDraft({
        subjectId: 'org_456',
        subjectType: 'organization',
        context: 'Employment relationship',
      })

      expect(result).toBeDefined()
      expect(result.subject_type).toBe('organization')
    })
  })

  describe('saveDraft()', () => {
    it('should save draft data', async () => {
      const result = await client.reviews.saveDraft({
        reviewId: 'review_123',
        draft: {
          step: 'skills',
          ratings: [{ skillId: 'skill_1', score: 4 }],
        },
      })

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
    })
  })

  describe('getDraft()', () => {
    it('should get draft by ID', async () => {
      const result = await client.reviews.getDraft({ reviewId: 'review_123' })

      expect(result).toBeDefined()
      expect(result.id).toBe('review_123')
    })

    it('should handle nonexistent draft', async () => {
      server.use(
        http.get('*/reviews/:reviewId/draft', () => {
          return HttpResponse.json({ error: 'Draft not found' }, { status: 404 })
        })
      )

      await expect(client.reviews.getDraft({ reviewId: 'invalid' })).rejects.toThrow()
    })
  })

  // ===== Review Steps =====

  describe('updateStep()', () => {
    it('should update review step', async () => {
      const result = await client.reviews.updateStep({
        reviewId: 'review_123',
        step: 'skills',
        data: { completed: true },
      })

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
    })
  })

  describe('updateSkillRatings()', () => {
    it('should update skill ratings', async () => {
      const result = await client.reviews.updateSkillRatings({
        reviewId: 'review_123',
        ratings: [
          { skillId: 'skill_1', score: 4 },
          { skillId: 'skill_2', score: 5 },
        ],
      })

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
    })
  })

  describe('updateCategoryRating()', () => {
    it('should update category rating', async () => {
      const result = await client.reviews.updateCategoryRating({
        reviewId: 'review_123',
        category: 'reliability',
        rating: 4,
      })

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
    })
  })

  describe('updateSoftSkillVotes()', () => {
    it('should update soft skill votes', async () => {
      const result = await client.reviews.updateSoftSkillVotes({
        reviewId: 'review_123',
        votes: [
          { skillId: 'skill_1', rating: 5, isStrength: true },
          { skillId: 'skill_2', rating: 3, isStrength: false, notes: 'Room for improvement' },
        ],
      })

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
    })
  })

  describe('updateComment()', () => {
    it('should update review comment', async () => {
      const result = await client.reviews.updateComment({
        reviewId: 'review_123',
        comment: 'Great to work with!',
        isPublic: true,
      })

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
    })
  })

  // ===== Submit Review =====

  describe('submitReview()', () => {
    it('should submit review with recommendation', async () => {
      const result = await client.reviews.submitReview({
        reviewId: 'review_123',
        recommendation: 1,
      })

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
    })

    it('should submit review with not recommend', async () => {
      const result = await client.reviews.submitReview({
        reviewId: 'review_456',
        recommendation: -1,
      })

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
    })
  })

  // ===== Get Reviews =====

  describe('getBySubject()', () => {
    it('should get reviews by subject', async () => {
      const result = await client.reviews.getBySubject({
        subjectId: 'user_123',
        subjectType: 'user',
      })

      expect(result).toBeDefined()
      expect(result).toBeInstanceOf(Array)
    })

    it('should filter reviews by status', async () => {
      const result = await client.reviews.getBySubject({
        subjectId: 'user_123',
        subjectType: 'user',
        status: 'submitted',
      })

      expect(result).toBeDefined()
      expect(result).toBeInstanceOf(Array)
    })
  })

  describe('getMyReviews()', () => {
    it('should get current user reviews', async () => {
      const result = await client.reviews.getMyReviews()

      expect(result).toBeDefined()
      expect(result).toBeInstanceOf(Array)
    })

    it('should include review details', async () => {
      const result = await client.reviews.getMyReviews()

      if (result.length > 0) {
        const review = result[0]
        expect(review.id).toBeDefined()
        expect(review.subject_id).toBeDefined()
        expect(review.subject_type).toBeDefined()
      }
    })
  })

  // ===== Review Analytics =====

  describe('getReviewAnalytics()', () => {
    it('should get review analytics for subject', async () => {
      const result = await client.reviews.getReviewAnalytics({
        subjectId: 'user_123',
        subjectType: 'user',
      })

      expect(result).toBeDefined()
      if (result) {
        expect(result.overall).toBeDefined()
        expect(result.overall.totalReviews).toBeDefined()
        expect(result.overall.recommendPercentage).toBeDefined()
      }
    })

    it('should include skills and categories', async () => {
      const result = await client.reviews.getReviewAnalytics({
        subjectId: 'user_123',
      })

      if (result) {
        expect(result.skills).toBeInstanceOf(Array)
        expect(result.categories).toBeInstanceOf(Array)
      }
    })

    it('should include tags (strengths and improvements)', async () => {
      const result = await client.reviews.getReviewAnalytics({
        subjectId: 'user_123',
      })

      if (result) {
        expect(result.tags).toBeDefined()
        expect(result.tags.strengths).toBeInstanceOf(Array)
        expect(result.tags.improvements).toBeInstanceOf(Array)
      }
    })

    it('should handle no reviews', async () => {
      server.use(
        http.get('*/reviews/analytics', () => {
          return HttpResponse.json(null)
        })
      )

      const result = await client.reviews.getReviewAnalytics({
        subjectId: 'user_new',
      })

      expect(result).toBeNull()
    })
  })

  // ===== Delete Draft =====

  describe('deleteDraft()', () => {
    it('should delete a review draft', async () => {
      const result = await client.reviews.deleteDraft({ reviewId: 'review_123' })

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
    })

    it('should handle nonexistent draft', async () => {
      server.use(
        http.delete('*/reviews/:reviewId/draft', () => {
          return HttpResponse.json({ error: 'Draft not found' }, { status: 404 })
        })
      )

      await expect(client.reviews.deleteDraft({ reviewId: 'invalid' })).rejects.toThrow()
    })
  })

  // ===== Error Handling =====

  describe('error handling', () => {
    it('should handle authentication errors', async () => {
      server.use(
        http.get('*/reviews/soft-skills', () => {
          return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
        })
      )

      await expect(client.reviews.getSoftSkills()).rejects.toThrow()
    })

    it('should handle rate limiting', { timeout: 15000 }, async () => {
      server.use(
        http.get('*/reviews/my-reviews', () => {
          return HttpResponse.json(
            { error: 'Rate limit exceeded' },
            { status: 429, headers: { 'Retry-After': '1' } }
          )
        })
      )

      await expect(client.reviews.getMyReviews()).rejects.toThrow()
    })

    it('should handle server errors', async () => {
      server.use(
        http.post('*/reviews/drafts', () => {
          return HttpResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
          )
        })
      )

      await expect(
        client.reviews.createDraft({
          subjectId: 'user_1',
          subjectType: 'user',
        })
      ).rejects.toThrow()
    })
  })
})
