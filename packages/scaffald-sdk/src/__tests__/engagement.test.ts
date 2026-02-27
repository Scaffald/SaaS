import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { Scaffald } from '../client.js'
import { server } from './mocks/server'

describe('Engagement', () => {
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

  // ===== Track Engagement Events =====

  describe('track()', () => {
    it('should track profile view event', async () => {
      const result = await client.engagement.track({
        eventType: 'profile_view',
        targetType: 'user',
        targetId: 'user_123',
      })

      expect(result).toBeDefined()
      expect(result.id).toBeDefined()
      expect(result.user_id).toBe('user_1')
      expect(result.event_type).toBe('profile_view')
      expect(result.target_type).toBe('user')
      expect(result.target_id).toBe('user_123')
      expect(result.occurred_at).toBeDefined()
      expect(result.created_at).toBeDefined()
    })

    it('should track job view event', async () => {
      const result = await client.engagement.track({
        eventType: 'job_view',
        targetType: 'job',
        targetId: 'job_456',
      })

      expect(result).toBeDefined()
      expect(result.event_type).toBe('job_view')
      expect(result.target_type).toBe('job')
      expect(result.target_id).toBe('job_456')
    })

    it('should track job click event', async () => {
      const result = await client.engagement.track({
        eventType: 'job_click',
        targetType: 'job',
        targetId: 'job_789',
      })

      expect(result).toBeDefined()
      expect(result.event_type).toBe('job_click')
    })

    it('should track application start event', async () => {
      const result = await client.engagement.track({
        eventType: 'application_start',
        targetType: 'job',
        targetId: 'job_apply_1',
      })

      expect(result).toBeDefined()
      expect(result.event_type).toBe('application_start')
    })

    it('should track application complete event', async () => {
      const result = await client.engagement.track({
        eventType: 'application_complete',
        targetType: 'job',
        targetId: 'job_apply_2',
      })

      expect(result).toBeDefined()
      expect(result.event_type).toBe('application_complete')
    })

    it('should track search event without target', async () => {
      const result = await client.engagement.track({
        eventType: 'search',
      })

      expect(result).toBeDefined()
      expect(result.event_type).toBe('search')
      expect(result.target_type).toBeUndefined()
      expect(result.target_id).toBeUndefined()
    })

    it('should track filter change event', async () => {
      const result = await client.engagement.track({
        eventType: 'filter_change',
      })

      expect(result).toBeDefined()
      expect(result.event_type).toBe('filter_change')
    })

    it('should track event with metadata', async () => {
      const result = await client.engagement.track({
        eventType: 'job_view',
        targetType: 'job',
        targetId: 'job_meta',
        metadata: {
          source: 'search_results',
          position: 3,
          query: 'software engineer',
        },
      })

      expect(result).toBeDefined()
      expect(result.event_metadata).toBeDefined()
      expect(result.event_metadata?.source).toBe('search_results')
      expect(result.event_metadata?.position).toBe(3)
    })

    it('should handle tracking without targetType when not required', async () => {
      const result = await client.engagement.track({
        eventType: 'search',
        metadata: { query: 'product manager' },
      })

      expect(result).toBeDefined()
      expect(result.event_type).toBe('search')
    })

    it('should reject invalid event type', async () => {
      await expect(
        // @ts-expect-error - Testing invalid event type
        client.engagement.track({ eventType: 'invalid_event' })
      ).rejects.toThrow()
    })

    it('should reject invalid target type', async () => {
      await expect(
        client.engagement.track({
          eventType: 'profile_view',
          // @ts-expect-error - Testing invalid target type
          targetType: 'invalid_target',
          targetId: 'test_123',
        })
      ).rejects.toThrow()
    })
  })

  // ===== Get Recent Activity =====

  describe('getRecentActivity()', () => {
    it('should get recent activity', async () => {
      const result = await client.engagement.getRecentActivity()

      expect(result).toBeDefined()
      expect(result.data).toBeInstanceOf(Array)
      expect(result.data.length).toBeGreaterThan(0)
    })

    it('should include event details', async () => {
      const result = await client.engagement.getRecentActivity()

      const event = result.data[0]
      expect(event.id).toBeDefined()
      expect(event.user_id).toBe('user_1')
      expect(event.event_type).toBeDefined()
      expect(event.occurred_at).toBeDefined()
      expect(event.created_at).toBeDefined()
    })

    it('should support limiting results', async () => {
      const result = await client.engagement.getRecentActivity({ limit: 5 })

      expect(result).toBeDefined()
      expect(result.data).toHaveLength(5)
    })

    it('should filter by event types', async () => {
      const result = await client.engagement.getRecentActivity({
        eventTypes: ['job_view', 'job_click'],
      })

      expect(result).toBeDefined()
      result.data.forEach((event) => {
        expect(['job_view', 'job_click']).toContain(event.event_type)
      })
    })

    it('should filter by single event type', async () => {
      const result = await client.engagement.getRecentActivity({
        eventTypes: ['profile_view'],
      })

      expect(result).toBeDefined()
      result.data.forEach((event) => {
        expect(event.event_type).toBe('profile_view')
      })
    })

    it('should handle multiple event type filters', async () => {
      const result = await client.engagement.getRecentActivity({
        eventTypes: ['application_start', 'application_complete'],
        limit: 10,
      })

      expect(result).toBeDefined()
      expect(result.data.length).toBeLessThanOrEqual(10)
    })

    it('should return empty array when no activity', async () => {
      const emptyClient = new Scaffald({
        apiKey: 'test_key_empty',
        baseUrl: 'https://api.scaffald.com',
      })

      const result = await emptyClient.engagement.getRecentActivity()

      expect(result).toBeDefined()
      expect(result.data).toBeInstanceOf(Array)
      expect(result.data).toHaveLength(0)
    })

    it('should preserve event metadata in activity list', async () => {
      const result = await client.engagement.getRecentActivity({ limit: 1 })

      const event = result.data[0]
      if (event.event_metadata) {
        expect(typeof event.event_metadata).toBe('object')
      }
    })
  })

  // ===== Get Engagement Metrics =====

  describe('getMetrics()', () => {
    it('should get engagement metrics', async () => {
      const result = await client.engagement.getMetrics()

      expect(result).toBeDefined()
      expect(result.profile_views).toBeDefined()
      expect(result.job_views).toBeDefined()
      expect(result.applications_started).toBeDefined()
      expect(result.applications_completed).toBeDefined()
      expect(result.searches).toBeDefined()
      expect(result.total_events).toBeDefined()
    })

    it('should have numeric metric values', async () => {
      const result = await client.engagement.getMetrics()

      expect(typeof result.profile_views).toBe('number')
      expect(typeof result.job_views).toBe('number')
      expect(typeof result.applications_started).toBe('number')
      expect(typeof result.applications_completed).toBe('number')
      expect(typeof result.searches).toBe('number')
      expect(typeof result.total_events).toBe('number')
    })

    it('should have non-negative metric values', async () => {
      const result = await client.engagement.getMetrics()

      expect(result.profile_views).toBeGreaterThanOrEqual(0)
      expect(result.job_views).toBeGreaterThanOrEqual(0)
      expect(result.applications_started).toBeGreaterThanOrEqual(0)
      expect(result.applications_completed).toBeGreaterThanOrEqual(0)
      expect(result.searches).toBeGreaterThanOrEqual(0)
      expect(result.total_events).toBeGreaterThanOrEqual(0)
    })

    it('should support custom time range (days)', async () => {
      const result = await client.engagement.getMetrics({ days: 7 })

      expect(result).toBeDefined()
      expect(result.total_events).toBeDefined()
    })

    it('should support 30-day metrics', async () => {
      const result = await client.engagement.getMetrics({ days: 30 })

      expect(result).toBeDefined()
    })

    it('should support 90-day metrics', async () => {
      const result = await client.engagement.getMetrics({ days: 90 })

      expect(result).toBeDefined()
    })

    it('should validate total_events is sum of specific events', async () => {
      const result = await client.engagement.getMetrics()

      const sum =
        result.profile_views +
        result.job_views +
        result.applications_started +
        result.applications_completed +
        result.searches

      // total_events should be at least the sum of tracked categories
      expect(result.total_events).toBeGreaterThanOrEqual(sum)
    })

    it('should handle zero metrics for new users', async () => {
      const newClient = new Scaffald({
        apiKey: 'test_key_new',
        baseUrl: 'https://api.scaffald.com',
      })

      const result = await newClient.engagement.getMetrics()

      expect(result).toBeDefined()
      expect(result.total_events).toBe(0)
    })
  })

  // ===== Edge Cases & Validation =====

  describe('validation', () => {
    it('should reject negative limit', async () => {
      await expect(
        client.engagement.getRecentActivity({ limit: -1 })
      ).rejects.toThrow()
    })

    it('should reject very large limit', async () => {
      await expect(
        client.engagement.getRecentActivity({ limit: 10000 })
      ).rejects.toThrow()
    })

    it('should reject negative days', async () => {
      await expect(
        client.engagement.getMetrics({ days: -7 })
      ).rejects.toThrow()
    })

    it('should reject zero days', async () => {
      await expect(
        client.engagement.getMetrics({ days: 0 })
      ).rejects.toThrow()
    })

    it('should cap days at reasonable maximum', async () => {
      const result = await client.engagement.getMetrics({ days: 365 })

      // Should either succeed with capped value or reject
      expect(result).toBeDefined()
    })

    it('should reject empty eventTypes array', async () => {
      await expect(
        client.engagement.getRecentActivity({ eventTypes: [] })
      ).rejects.toThrow()
    })

    it('should reject invalid event types in filter', async () => {
      await expect(
        client.engagement.getRecentActivity({ eventTypes: ['invalid_type'] })
      ).rejects.toThrow()
    })
  })

  // ===== Error Handling =====

  describe('error handling', () => {
    it('should handle 401 unauthorized', async () => {
      await expect(
        client.engagement.track({
          eventType: 'profile_view',
          targetType: 'user',
          targetId: 'user_unauthorized',
        })
      ).rejects.toThrow()
    })

    it('should handle 404 not found for invalid targets', async () => {
      await expect(
        client.engagement.track({
          eventType: 'job_view',
          targetType: 'job',
          targetId: 'job_nonexistent',
        })
      ).rejects.toThrow()
    })

    it('should handle 429 rate limit', async () => {
      await expect(
        client.engagement.track({
          eventType: 'profile_view',
          targetType: 'user',
          targetId: 'user_rate_limit',
        })
      ).rejects.toThrow()
    })

    it('should handle 500 server error', async () => {
      await expect(
        client.engagement.getMetrics({ days: 999999 })
      ).rejects.toThrow()
    })

    it('should handle network errors', async () => {
      await expect(
        client.engagement.track({
          eventType: 'search',
          metadata: { network_error: true },
        })
      ).rejects.toThrow()
    })
  })

  // ===== Privacy & Analytics =====

  describe('privacy and analytics', () => {
    it('should not expose other users activity', async () => {
      const result = await client.engagement.getRecentActivity()

      result.data.forEach((event) => {
        expect(event.user_id).toBe('user_1') // Only current user's events
      })
    })

    it('should handle tracking on deactivated targets', async () => {
      await expect(
        client.engagement.track({
          eventType: 'profile_view',
          targetType: 'user',
          targetId: 'user_deactivated',
        })
      ).rejects.toThrow()
    })

    it('should allow tracking on private profiles', async () => {
      // Tracking should work even for private profiles
      const result = await client.engagement.track({
        eventType: 'profile_view',
        targetType: 'user',
        targetId: 'user_private',
      })

      expect(result).toBeDefined()
    })

    it('should sanitize metadata for privacy', async () => {
      const result = await client.engagement.track({
        eventType: 'search',
        metadata: {
          query: 'test query',
          user_agent: 'Mozilla/5.0...',
          ip_address: '192.168.1.1', // Should be sanitized
        },
      })

      expect(result).toBeDefined()
      // IP should not be stored in metadata
      expect(result.event_metadata).not.toHaveProperty('ip_address')
    })
  })

  // ===== Performance & Scalability =====

  describe('performance', () => {
    it('should track events efficiently', async () => {
      const start = Date.now()
      await client.engagement.track({
        eventType: 'job_view',
        targetType: 'job',
        targetId: 'job_perf',
      })
      const duration = Date.now() - start

      expect(duration).toBeLessThan(500) // Should track quickly
    })

    it('should retrieve activity efficiently', async () => {
      const start = Date.now()
      await client.engagement.getRecentActivity({ limit: 50 })
      const duration = Date.now() - start

      expect(duration).toBeLessThan(1000)
    })

    it('should calculate metrics efficiently', async () => {
      const start = Date.now()
      await client.engagement.getMetrics({ days: 30 })
      const duration = Date.now() - start

      expect(duration).toBeLessThan(1000)
    })
  })

  // ===== Event Sequencing & Timing =====

  describe('event sequencing', () => {
    it('should maintain event chronology', async () => {
      const result = await client.engagement.getRecentActivity({ limit: 10 })

      // Events should be ordered by occurred_at (most recent first)
      for (let i = 0; i < result.data.length - 1; i++) {
        const current = new Date(result.data[i].occurred_at).getTime()
        const next = new Date(result.data[i + 1].occurred_at).getTime()
        expect(current).toBeGreaterThanOrEqual(next)
      }
    })

    it('should track occurred_at accurately', async () => {
      const before = Date.now()
      const result = await client.engagement.track({
        eventType: 'job_click',
        targetType: 'job',
        targetId: 'job_timing',
      })
      const after = Date.now()

      const occurredAt = new Date(result.occurred_at).getTime()
      expect(occurredAt).toBeGreaterThanOrEqual(before - 1000) // 1s tolerance
      expect(occurredAt).toBeLessThanOrEqual(after + 1000)
    })

    it('should distinguish created_at from occurred_at', async () => {
      const result = await client.engagement.track({
        eventType: 'profile_view',
        targetType: 'user',
        targetId: 'user_timing',
      })

      expect(result.occurred_at).toBeDefined()
      expect(result.created_at).toBeDefined()
      // They might be the same or slightly different
      const occurred = new Date(result.occurred_at).getTime()
      const created = new Date(result.created_at).getTime()
      expect(Math.abs(occurred - created)).toBeLessThan(5000) // Within 5 seconds
    })
  })

  // ===== Metadata Handling =====

  describe('metadata handling', () => {
    it('should handle complex metadata objects', async () => {
      const result = await client.engagement.track({
        eventType: 'job_view',
        targetType: 'job',
        targetId: 'job_complex',
        metadata: {
          source: 'search',
          filters: ['remote', 'full_time'],
          position: 5,
          page: 2,
          sessionId: 'session_123',
        },
      })

      expect(result.event_metadata).toBeDefined()
      expect(result.event_metadata?.source).toBe('search')
      expect(result.event_metadata?.filters).toEqual(['remote', 'full_time'])
    })

    it('should handle null metadata', async () => {
      const result = await client.engagement.track({
        eventType: 'search',
        metadata: undefined,
      })

      expect(result).toBeDefined()
      expect(result.event_metadata).toBeUndefined()
    })

    it('should handle empty metadata object', async () => {
      const result = await client.engagement.track({
        eventType: 'filter_change',
        metadata: {},
      })

      expect(result).toBeDefined()
    })
  })
})
