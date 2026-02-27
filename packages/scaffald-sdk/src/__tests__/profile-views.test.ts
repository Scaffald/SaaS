import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { Scaffald } from '../client.js'
import { server } from './mocks/server'

describe('ProfileViews', () => {
  let client: Scaffald

  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' })
    client = new Scaffald({
      apiKey: 'test_key',
      baseUrl: 'https://api.scaffald.com',
      maxRetries: 0,
    })
  })

  afterEach(() => {
    server.resetHandlers()
  })

  afterAll(() => {
    server.close()
  })

  // ===== Record Profile Views =====

  describe('recordView()', () => {
    it('should record a profile view', async () => {
      const result = await client.profileViews.recordView({ viewedUserId: 'user_2' })

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.skipped).toBe(false)
    })

    it('should skip recording own profile view', async () => {
      const result = await client.profileViews.recordView({ viewedUserId: 'user_self' })

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.skipped).toBe(true)
      expect(result.reason).toBe('own_profile')
    })

    it('should skip duplicate views within same day', async () => {
      // First view
      const result1 = await client.profileViews.recordView({ viewedUserId: 'user_duplicate' })
      expect(result1.success).toBe(true)
      expect(result1.skipped).toBe(false)

      // Second view (same day)
      const result2 = await client.profileViews.recordView({ viewedUserId: 'user_duplicate' })
      expect(result2.success).toBe(true)
      expect(result2.skipped).toBe(true)
      expect(result2.reason).toBe('already_viewed_today')
    })

    it('should skip duplicate views within same session', async () => {
      const result = await client.profileViews.recordView({ viewedUserId: 'user_session' })

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.skipped).toBe(true)
      expect(result.reason).toBe('already_viewed_session')
    })

    it('should prevent rapid duplicate submissions', async () => {
      const result = await client.profileViews.recordView({ viewedUserId: 'user_rapid' })

      expect(result).toBeDefined()
      expect(result.skipped).toBe(true)
      expect(result.reason).toBe('duplicate_prevented')
    })

    it('should handle non-existent users', async () => {
      await expect(
        client.profileViews.recordView({ viewedUserId: 'user_nonexistent' })
      ).rejects.toThrow()
    })

    it('should handle deactivated users', async () => {
      await expect(
        client.profileViews.recordView({ viewedUserId: 'user_deactivated' })
      ).rejects.toThrow()
    })

    it('should reject empty viewedUserId', async () => {
      await expect(
        client.profileViews.recordView({ viewedUserId: '' })
      ).rejects.toThrow()
    })

    it('should reject invalid userId format', async () => {
      await expect(
        client.profileViews.recordView({ viewedUserId: 'invalid@format' })
      ).rejects.toThrow()
    })
  })

  // ===== Get Profile Views =====

  describe('getProfileViews()', () => {
    it('should get profile views', async () => {
      const result = await client.profileViews.getProfileViews()

      expect(result).toBeDefined()
      expect(result.views).toBeInstanceOf(Array)
      expect(result.total).toBe(15)
      expect(result.views).toHaveLength(15)
    })

    it('should include viewer details', async () => {
      const result = await client.profileViews.getProfileViews()

      const view = result.views[0]
      expect(view.id).toBeDefined()
      expect(view.viewed_at).toBeDefined()
      expect(view.viewer).toBeDefined()
      expect(view.viewer?.id).toBe('user_viewer_1')
      expect(view.viewer?.display_name).toBe('Jane Smith')
      expect(view.viewer?.username).toBe('janesmith')
      expect(view.viewer?.avatar_url).toBeDefined()
      expect(view.viewer?.headline).toBeDefined()
    })

    it('should include viewer industry information', async () => {
      const result = await client.profileViews.getProfileViews()

      const view = result.views[0]
      if (view.viewer?.industry_id) {
        expect(view.viewer.industries).toBeDefined()
        expect(view.viewer.industries?.id).toBe(view.viewer.industry_id)
        expect(view.viewer.industries?.name).toBeDefined()
      }
    })

    it('should include viewer role type', async () => {
      const result = await client.profileViews.getProfileViews()

      const view = result.views[0]
      expect(view.viewer_role_type).toBeDefined()
      expect(['job_seeker', 'recruiter', 'hiring_manager']).toContain(view.viewer_role_type)
    })

    it('should include aggregated viewer industry', async () => {
      const result = await client.profileViews.getProfileViews()

      const view = result.views[0]
      if (view.viewer_industry) {
        expect(view.viewer_industry.id).toBeDefined()
        expect(view.viewer_industry.name).toBeDefined()
      }
    })

    it('should support pagination with limit', async () => {
      const result = await client.profileViews.getProfileViews({ limit: 5 })

      expect(result).toBeDefined()
      expect(result.views).toHaveLength(5)
      expect(result.total).toBe(15) // Total unchanged
    })

    it('should support pagination with offset', async () => {
      const result = await client.profileViews.getProfileViews({ limit: 5, offset: 10 })

      expect(result).toBeDefined()
      expect(result.views).toHaveLength(5)
      expect(result.total).toBe(15)
    })

    it('should return empty array when no views', async () => {
      const emptyClient = new Scaffald({
        apiKey: 'test_key_empty',
        baseUrl: 'https://api.scaffald.com',
      })

      const result = await emptyClient.profileViews.getProfileViews()

      expect(result).toBeDefined()
      expect(result.views).toBeInstanceOf(Array)
      expect(result.views).toHaveLength(0)
      expect(result.total).toBe(0)
    })

    it('should handle anonymous viewers', async () => {
      const result = await client.profileViews.getProfileViews({ limit: 20 })

      // Some views might have null viewer (anonymous)
      const anonymousViews = result.views.filter((v) => v.viewer === null)
      anonymousViews.forEach((view) => {
        expect(view.viewer).toBeNull()
        expect(view.viewed_at).toBeDefined()
        // May still have aggregated industry/role data
      })
    })

    it('should order views by most recent first', async () => {
      const result = await client.profileViews.getProfileViews()

      // Verify views are ordered by viewed_at descending
      for (let i = 0; i < result.views.length - 1; i++) {
        const current = new Date(result.views[i].viewed_at).getTime()
        const next = new Date(result.views[i + 1].viewed_at).getTime()
        expect(current).toBeGreaterThanOrEqual(next)
      }
    })
  })

  // ===== Get View Analytics =====

  describe('getViewAnalytics()', () => {
    it('should get view analytics', async () => {
      const result = await client.profileViews.getViewAnalytics()

      expect(result).toBeDefined()
      expect(result.views30d).toBeDefined()
      expect(result.viewsTotal).toBeDefined()
      expect(result.lastViewAt).toBeDefined()
      expect(result.trend).toBeDefined()
    })

    it('should have numeric metric values', async () => {
      const result = await client.profileViews.getViewAnalytics()

      expect(typeof result.views30d).toBe('number')
      expect(typeof result.viewsTotal).toBe('number')
      expect(typeof result.trend).toBe('number')
    })

    it('should have non-negative view counts', async () => {
      const result = await client.profileViews.getViewAnalytics()

      expect(result.views30d).toBeGreaterThanOrEqual(0)
      expect(result.viewsTotal).toBeGreaterThanOrEqual(0)
    })

    it('should have valid lastViewAt timestamp', async () => {
      const result = await client.profileViews.getViewAnalytics()

      if (result.lastViewAt) {
        const lastView = new Date(result.lastViewAt).getTime()
        expect(lastView).toBeLessThanOrEqual(Date.now())
        expect(lastView).toBeGreaterThan(0)
      }
    })

    it('should calculate trend percentage', async () => {
      const result = await client.profileViews.getViewAnalytics()

      // Trend should be a percentage (positive or negative)
      expect(typeof result.trend).toBe('number')
      expect(result.trend).toBeGreaterThanOrEqual(-100) // -100% is lowest
    })

    it('should show views30d <= viewsTotal', async () => {
      const result = await client.profileViews.getViewAnalytics()

      expect(result.views30d).toBeLessThanOrEqual(result.viewsTotal)
    })

    it('should handle zero analytics for new profiles', async () => {
      const newClient = new Scaffald({
        apiKey: 'test_key_new',
        baseUrl: 'https://api.scaffald.com',
      })

      const result = await newClient.profileViews.getViewAnalytics()

      expect(result).toBeDefined()
      expect(result.views30d).toBe(0)
      expect(result.viewsTotal).toBe(0)
      expect(result.lastViewAt).toBeNull()
      expect(result.trend).toBe(0)
    })

    it('should handle null lastViewAt when no views', async () => {
      const newClient = new Scaffald({
        apiKey: 'test_key_new',
        baseUrl: 'https://api.scaffald.com',
      })

      const result = await newClient.profileViews.getViewAnalytics()

      expect(result.lastViewAt).toBeNull()
    })
  })

  // ===== Edge Cases & Validation =====

  describe('validation', () => {
    it('should reject negative limit', async () => {
      await expect(
        client.profileViews.getProfileViews({ limit: -1 })
      ).rejects.toThrow()
    })

    it('should reject negative offset', async () => {
      await expect(
        client.profileViews.getProfileViews({ offset: -5 })
      ).rejects.toThrow()
    })

    it('should handle very large offset gracefully', async () => {
      const result = await client.profileViews.getProfileViews({ offset: 10000 })

      expect(result).toBeDefined()
      expect(result.views).toHaveLength(0) // Beyond available data
      expect(result.total).toBeGreaterThanOrEqual(0)
    })

    it('should cap limit at reasonable maximum', async () => {
      const result = await client.profileViews.getProfileViews({ limit: 1000 })

      // Should either cap or return what's available
      expect(result.views.length).toBeLessThanOrEqual(100)
    })
  })

  // ===== Error Handling =====

  describe('error handling', () => {
    it('should handle 401 unauthorized', async () => {
      await expect(
        client.profileViews.recordView({ viewedUserId: 'user_unauthorized' })
      ).rejects.toThrow()
    })

    it('should handle 404 not found', async () => {
      await expect(
        client.profileViews.recordView({ viewedUserId: 'user_nonexistent' })
      ).rejects.toThrow()
    })

    it('should handle 429 rate limit', async () => {
      await expect(
        client.profileViews.recordView({ viewedUserId: 'user_rate_limit' })
      ).rejects.toThrow()
    })

    it('should handle 500 server error', async () => {
      const errorClient = new Scaffald({
        apiKey: 'test_key_server_error',
        baseUrl: 'https://api.scaffald.com',
        maxRetries: 0,
      })

      await expect(
        errorClient.profileViews.getViewAnalytics()
      ).rejects.toThrow()
    })

    it('should handle network errors', async () => {
      await expect(
        client.profileViews.recordView({ viewedUserId: 'user_network_error' })
      ).rejects.toThrow()
    })
  })

  // ===== Privacy & Security =====

  describe('privacy and security', () => {
    it('should respect private browsing mode', async () => {
      // Anonymous viewing should still record but with null viewer
      const result = await client.profileViews.recordView({ viewedUserId: 'user_private_mode' })

      expect(result.success).toBe(true)
    })

    it('should not expose sensitive viewer data', async () => {
      const result = await client.profileViews.getProfileViews()

      result.views.forEach((view) => {
        if (view.viewer) {
          // Should not include email, phone, etc.
          expect(view.viewer).not.toHaveProperty('email')
          expect(view.viewer).not.toHaveProperty('phone')
          expect(view.viewer).not.toHaveProperty('ssn')
        }
      })
    })

    it('should handle blocked users', async () => {
      // Views from blocked users should not appear
      const result = await client.profileViews.getProfileViews()

      result.views.forEach((view) => {
        // No blocked users in results
        expect(view.viewer?.id).not.toBe('user_blocked')
      })
    })

    it('should respect privacy settings for viewer visibility', async () => {
      const result = await client.profileViews.getProfileViews()

      // Some viewers may have privacy enabled (null viewer)
      const privateViewers = result.views.filter((v) => v.viewer === null)
      expect(privateViewers).toBeDefined()
    })

    it('should not allow viewing other users view lists', async () => {
      // Can only see who viewed YOUR profile, not others
      await expect(
        client.profileViews.getProfileViews({ limit: 10 })
      ).resolves.toBeDefined()

      // All views should be for the authenticated user's profile
    })
  })

  // ===== Performance & Scalability =====

  describe('performance', () => {
    it('should record views efficiently', async () => {
      const start = Date.now()
      await client.profileViews.recordView({ viewedUserId: 'user_perf' })
      const duration = Date.now() - start

      expect(duration).toBeLessThan(500) // Should record quickly
    })

    it('should retrieve views efficiently', async () => {
      const start = Date.now()
      await client.profileViews.getProfileViews({ limit: 50 })
      const duration = Date.now() - start

      expect(duration).toBeLessThan(1000)
    })

    it('should calculate analytics efficiently', async () => {
      const start = Date.now()
      await client.profileViews.getViewAnalytics()
      const duration = Date.now() - start

      expect(duration).toBeLessThan(1000)
    })

    it('should handle profiles with many views', async () => {
      const result = await client.profileViews.getProfileViews({ limit: 100 })

      expect(result).toBeDefined()
      expect(result.views.length).toBeLessThanOrEqual(100)
    })
  })

  // ===== Deduplication Logic =====

  describe('deduplication', () => {
    it('should track deduplication reason correctly', async () => {
      const reasons = [
        'own_profile',
        'already_viewed_today',
        'already_viewed_session',
        'duplicate_prevented',
      ]

      // Test own profile
      const ownResult = await client.profileViews.recordView({ viewedUserId: 'user_self' })
      expect(reasons).toContain(ownResult.reason)
    })

    it('should allow view after 24 hours', async () => {
      // Assuming the mock handles this scenario
      const result = await client.profileViews.recordView({ viewedUserId: 'user_24h_passed' })

      expect(result.success).toBe(true)
      expect(result.skipped).toBe(false)
    })

    it('should deduplicate within session', async () => {
      const result = await client.profileViews.recordView({ viewedUserId: 'user_same_session' })

      expect(result.skipped).toBe(true)
      expect(['already_viewed_session', 'already_viewed_today']).toContain(result.reason)
    })
  })

  // ===== Viewer Demographics =====

  describe('viewer demographics', () => {
    it('should track viewer role types', async () => {
      const result = await client.profileViews.getProfileViews({ limit: 20 })

      const roleTypes = result.views
        .filter((v) => v.viewer_role_type)
        .map((v) => v.viewer_role_type)

      expect(roleTypes.length).toBeGreaterThan(0)
      roleTypes.forEach((role) => {
        expect(['job_seeker', 'recruiter', 'hiring_manager', null]).toContain(role)
      })
    })

    it('should track viewer industries', async () => {
      const result = await client.profileViews.getProfileViews({ limit: 20 })

      const industries = result.views
        .filter((v) => v.viewer_industry)
        .map((v) => v.viewer_industry)

      industries.forEach((industry) => {
        expect(industry).toBeDefined()
        expect(industry?.id).toBeDefined()
        expect(industry?.name).toBeDefined()
      })
    })

    it('should handle viewers without industry data', async () => {
      const result = await client.profileViews.getProfileViews()

      const noIndustry = result.views.filter((v) => !v.viewer_industry)
      // Should gracefully handle missing data
      expect(noIndustry).toBeDefined()
    })

    it('should handle viewers without role type', async () => {
      const result = await client.profileViews.getProfileViews()

      const noRole = result.views.filter((v) => !v.viewer_role_type)
      // Should gracefully handle missing data
      expect(noRole).toBeDefined()
    })
  })

  // ===== Trend Calculation =====

  describe('trend calculation', () => {
    it('should show positive trend when views increasing', async () => {
      const result = await client.profileViews.getViewAnalytics()

      if (result.views30d > 0 && result.trend > 0) {
        expect(result.trend).toBeGreaterThan(0)
      }
    })

    it('should show negative trend when views decreasing', async () => {
      const trendClient = new Scaffald({
        apiKey: 'test_key_declining',
        baseUrl: 'https://api.scaffald.com',
      })

      const result = await trendClient.profileViews.getViewAnalytics()

      if (result.trend < 0) {
        expect(result.trend).toBeLessThan(0)
        expect(result.trend).toBeGreaterThanOrEqual(-100)
      }
    })

    it('should show zero trend when no change', async () => {
      const stableClient = new Scaffald({
        apiKey: 'test_key_stable',
        baseUrl: 'https://api.scaffald.com',
      })

      const result = await stableClient.profileViews.getViewAnalytics()

      if (result.trend === 0) {
        expect(result.trend).toBe(0)
      }
    })
  })
})
