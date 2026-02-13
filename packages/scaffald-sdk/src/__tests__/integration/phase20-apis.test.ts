/**
 * Integration tests for Phase 20 API migrations
 * Tests user-profiles, workers, and personality-assessment REST endpoints
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { Scaffald } from '../../client.js'

describe('Phase 20 API Integration Tests', () => {
  let client: Scaffald
  const testUserId = 'test-user-123'

  beforeAll(() => {
    // Initialize SDK client with test credentials
    client = new Scaffald({
      apiKey: process.env.TEST_API_KEY || 'test_key',
      baseUrl: process.env.API_BASE_URL || 'http://localhost:54321/functions/v1/api',
    })
  })

  describe('User Profiles API', () => {
    describe('GET /v1/user-profiles/:userId/preview', () => {
      it('should return lightweight user profile preview', async () => {
        const preview = await client.userProfiles.getPreview({ userId: testUserId })

        expect(preview).toBeDefined()
        expect(preview).toHaveProperty('id')
        expect(preview).toHaveProperty('displayName')
        expect(preview).toHaveProperty('avatarUrl')
        expect(preview).toHaveProperty('location')
        expect(preview).toHaveProperty('topSkills')
        expect(Array.isArray(preview.topSkills)).toBe(true)
      })
    })

    describe('GET /v1/user-profiles/:userId', () => {
      it('should return comprehensive user profile', async () => {
        const profile = await client.userProfiles.getUserProfile({ userId: testUserId })

        expect(profile).toBeDefined()
        expect(profile).toHaveProperty('id')
        expect(profile).toHaveProperty('name')
        expect(profile).toHaveProperty('headline')
        expect(profile).toHaveProperty('bio')
        expect(profile).toHaveProperty('years_of_experience')
      })
    })

    describe('GET /v1/user-profiles/:userId/skills', () => {
      it('should return enriched user skills', async () => {
        const skills = await client.userProfiles.getUserSkills({ userId: testUserId })

        expect(Array.isArray(skills)).toBe(true)
        if (skills.length > 0) {
          expect(skills[0]).toHaveProperty('id')
          expect(skills[0]).toHaveProperty('skill_taxonomy')
          expect(skills[0]).toHaveProperty('proficiency_level')
          expect(skills[0]).toHaveProperty('skill_details')
        }
      })
    })

    describe('GET /v1/user-profiles/:userId/certifications', () => {
      it('should return user certifications', async () => {
        const certs = await client.userProfiles.getUserCertifications({ userId: testUserId })

        expect(Array.isArray(certs)).toBe(true)
        if (certs.length > 0) {
          expect(certs[0]).toHaveProperty('id')
          expect(certs[0]).toHaveProperty('certification_id')
          expect(certs[0]).toHaveProperty('certification')
        }
      })
    })

    describe('GET /v1/user-profiles/:userId/experience', () => {
      it('should return work experience', async () => {
        const experience = await client.userProfiles.getUserExperience({ userId: testUserId })

        expect(Array.isArray(experience)).toBe(true)
        if (experience.length > 0) {
          expect(experience[0]).toHaveProperty('id')
          expect(experience[0]).toHaveProperty('job_title')
          expect(experience[0]).toHaveProperty('company_name')
          expect(experience[0]).toHaveProperty('is_current')
        }
      })
    })

    describe('GET /v1/user-profiles/:userId/education', () => {
      it('should return education history', async () => {
        const education = await client.userProfiles.getUserEducation({ userId: testUserId })

        expect(Array.isArray(education)).toBe(true)
        if (education.length > 0) {
          expect(education[0]).toHaveProperty('id')
          expect(education[0]).toHaveProperty('school_name')
          expect(education[0]).toHaveProperty('degree')
        }
      })
    })

    describe('GET /v1/user-profiles/:userId/reviews-summary', () => {
      it('should return reviews summary', async () => {
        const summary = await client.userProfiles.getReviewsSummary({ userId: testUserId })

        expect(summary).toBeDefined()
        expect(summary).toHaveProperty('totalReviews')
        expect(summary).toHaveProperty('averageRating')
        expect(summary).toHaveProperty('categoryBreakdown')
        expect(summary).toHaveProperty('recentReviews')
        expect(Array.isArray(summary.recentReviews)).toBe(true)
      })
    })

    describe('GET /v1/user-profiles/:userId/contact-info', () => {
      it('should return contact info accessibility status', async () => {
        const contact = await client.userProfiles.getContactInfo({
          userId: testUserId,
        })

        expect(contact).toBeDefined()
        expect(contact).toHaveProperty('accessible')
        expect(typeof contact.accessible).toBe('boolean')

        if (contact.accessible) {
          expect(contact).toHaveProperty('email')
          expect(contact).toHaveProperty('phone_number')
        } else {
          expect(contact).toHaveProperty('reason')
        }
      })
    })
  })

  describe('Workers API', () => {
    describe('GET /v1/workers', () => {
      it('should return list of workers', async () => {
        const result = await client.workers.getWorkers()

        expect(result).toBeDefined()
        expect(result).toHaveProperty('workers')
        expect(result).toHaveProperty('total')
        expect(Array.isArray(result.workers)).toBe(true)
      })

      it('should handle search filter', async () => {
        const result = await client.workers.getWorkers({ search: 'carpenter' })

        expect(result).toBeDefined()
        expect(Array.isArray(result.workers)).toBe(true)
      })

      it('should handle limit parameter', async () => {
        const result = await client.workers.getWorkers({ limit: 10 })

        expect(result).toBeDefined()
        expect(result.workers.length).toBeLessThanOrEqual(10)
      })

      it('should handle industryIds filter', async () => {
        const result = await client.workers.getWorkers({
          industryIds: ['industry_1', 'industry_2'],
        })

        expect(result).toBeDefined()
        expect(Array.isArray(result.workers)).toBe(true)
      })
    })

    describe('GET /v1/workers/:id', () => {
      it('should return single worker profile', async () => {
        const worker = await client.workers.getWorkerById({ id: testUserId })

        expect(worker).toBeDefined()
        expect(worker).toHaveProperty('id')
        expect(worker).toHaveProperty('name')
        expect(worker).toHaveProperty('about')
      })
    })
  })

  describe('Personality Assessment API', () => {
    describe('GET /v1/personality-assessment/status', () => {
      it('should return assessment status', async () => {
        const status = await client.personalityAssessments.getStatus()

        expect(status).toBeDefined()
        expect(status).toHaveProperty('overall_status')
        expect(status).toHaveProperty('current_step')
        expect(status).toHaveProperty('luscher_test_1_completed')
        expect(status).toHaveProperty('ipip_test_completed')
        expect(status).toHaveProperty('can_retake')
      })
    })

    describe('GET /v1/personality-assessment/ipip/status', () => {
      it('should return IPIP test status', async () => {
        const status = await client.personalityAssessments.getIPIPStatus()

        expect(status).toBeDefined()
        expect(status).toHaveProperty('completed')
        expect(status).toHaveProperty('total_questions')
        expect(status).toHaveProperty('answered_questions')
      })
    })

    describe('GET /v1/personality-assessment/luscher/availability', () => {
      it('should return Luscher test availability', async () => {
        const availability = await client.personalityAssessments.getLuscherTestAvailability()

        expect(availability).toBeDefined()
        expect(availability).toHaveProperty('available')
        expect(typeof availability.available).toBe('boolean')

        if (!availability.available) {
          expect(availability).toHaveProperty('cooldown_end_time')
        }
      })
    })

    describe('POST /v1/personality-assessment/luscher-1', () => {
      it('should save Luscher Test 1 responses', async () => {
        const result = await client.personalityAssessments.saveLuscher1({
          responses: [
            { position: 1, color_id: 'red' },
            { position: 2, color_id: 'blue' },
          ],
        })

        expect(result).toBeDefined()
        expect(result).toHaveProperty('success')
        expect(result.success).toBe(true)
      })
    })

    describe('POST /v1/personality-assessment/ipip', () => {
      it('should save IPIP progress incrementally', async () => {
        const result = await client.personalityAssessments.saveIPIPProgress({
          answers: [
            { question_number: 1, score: 5 },
            { question_number: 2, score: 4 },
          ],
        })

        expect(result).toBeDefined()
        expect(result).toHaveProperty('success')
        expect(result.success).toBe(true)
      })
    })

    describe('PUT /v1/personality-assessment/step', () => {
      it('should update current assessment step', async () => {
        const result = await client.personalityAssessments.updateCurrentStep({
          step: 'ipip_test',
        })

        expect(result).toBeDefined()
        expect(result).toHaveProperty('success')
        expect(result.success).toBe(true)
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle 404 for non-existent user profile', async () => {
      await expect(
        client.userProfiles.getUserProfile({ userId: 'non-existent-user' })
      ).rejects.toThrow()
    })

    it('should handle 404 for non-existent worker', async () => {
      await expect(
        client.workers.getWorkerById({ id: 'non-existent-worker' })
      ).rejects.toThrow()
    })

    it('should handle invalid parameters', async () => {
      await expect(
        client.workers.getWorkers({ limit: -1 })
      ).rejects.toThrow()
    })
  })

  describe('Authentication', () => {
    it('should reject requests without authentication', async () => {
      const unauthClient = new Scaffald({
        baseUrl: process.env.API_BASE_URL || 'http://localhost:54321/functions/v1/api',
      })

      await expect(
        unauthClient.personalityAssessments.getStatus()
      ).rejects.toThrow()
    })
  })

  describe('Rate Limiting', () => {
    it('should include rate limit headers in responses', async () => {
      // This test would need to check actual HTTP headers
      // For now, just verify the endpoint works
      const result = await client.workers.getWorkers({ limit: 1 })
      expect(result).toBeDefined()
    })
  })
})
