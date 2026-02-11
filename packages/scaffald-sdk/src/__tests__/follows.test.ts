import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { Scaffald } from '../client.js'
import { server } from './mocks/server'

describe('Follows', () => {
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

  // ===== Follow Operations =====

  describe('followUser()', () => {
    it('should follow a user', async () => {
      const result = await client.follows.followUser({ targetUserId: 'user_2' })

      expect(result).toBeDefined()
      expect(result.id).toBe('follow_1')
      expect(result.follower_id).toBe('user_1')
      expect(result.followee_id).toBe('user_2')
      expect(result.followee_type).toBe('user')
      expect(result.created_at).toBeDefined()
    })

    it('should include follower and followee details', async () => {
      const result = await client.follows.followUser({ targetUserId: 'user_2' })

      expect(result.follower).toBeDefined()
      expect(result.follower?.id).toBe('user_1')
      expect(result.follower?.first_name).toBe('Alice')
      expect(result.follower?.last_name).toBe('Johnson')

      expect(result.followee).toBeDefined()
      expect(result.followee?.id).toBe('user_2')
      expect(result.followee?.name).toBe('Bob Smith')
    })

    it('should handle duplicate follow attempts', async () => {
      // First follow succeeds
      const result1 = await client.follows.followUser({ targetUserId: 'user_duplicate' })
      expect(result1.id).toBeDefined()

      // Second follow returns existing relationship
      const result2 = await client.follows.followUser({ targetUserId: 'user_duplicate' })
      expect(result2.id).toBe(result1.id)
    })

    it('should reject following yourself', async () => {
      await expect(
        client.follows.followUser({ targetUserId: 'user_self' })
      ).rejects.toThrow()
    })

    it('should handle non-existent users', async () => {
      await expect(
        client.follows.followUser({ targetUserId: 'user_nonexistent' })
      ).rejects.toThrow()
    })
  })

  describe('unfollowUser()', () => {
    it('should unfollow a user', async () => {
      await expect(
        client.follows.unfollowUser('user_2')
      ).resolves.not.toThrow()
    })

    it('should handle unfollowing non-followed user', async () => {
      await expect(
        client.follows.unfollowUser('user_not_followed')
      ).resolves.not.toThrow() // Should be idempotent
    })

    it('should handle non-existent users', async () => {
      await expect(
        client.follows.unfollowUser('user_nonexistent')
      ).rejects.toThrow()
    })
  })

  // ===== Following/Followers Lists =====

  describe('getFollowing()', () => {
    it('should get users the current user is following', async () => {
      const result = await client.follows.getFollowing()

      expect(result).toBeDefined()
      expect(result.data).toBeInstanceOf(Array)
      expect(result.total).toBe(3)
      expect(result.data).toHaveLength(3)
    })

    it('should include follow details and user info', async () => {
      const result = await client.follows.getFollowing()

      const follow = result.data[0]
      expect(follow.id).toBe('follow_1')
      expect(follow.follower_id).toBe('user_1')
      expect(follow.followee_id).toBe('user_2')
      expect(follow.followee_type).toBe('user')
      expect(follow.followee).toBeDefined()
      expect(follow.followee?.name).toBe('Bob Smith')
    })

    it('should support pagination with limit', async () => {
      const result = await client.follows.getFollowing({ limit: 2 })

      expect(result).toBeDefined()
      expect(result.data).toHaveLength(2)
      expect(result.total).toBe(3) // Total unchanged
    })

    it('should support pagination with offset', async () => {
      const result = await client.follows.getFollowing({ limit: 2, offset: 2 })

      expect(result).toBeDefined()
      expect(result.data).toHaveLength(1) // Only 1 remaining after offset 2
      expect(result.total).toBe(3)
    })

    it('should return empty array when not following anyone', async () => {
      // Mock user with no following
      const result = await client.follows.getFollowing({ limit: 0 })

      expect(result).toBeDefined()
      expect(result.data).toBeInstanceOf(Array)
      expect(result.data).toHaveLength(0)
      expect(result.total).toBe(0)
    })
  })

  describe('getFollowers()', () => {
    it('should get users following the current user', async () => {
      const result = await client.follows.getFollowers()

      expect(result).toBeDefined()
      expect(result.data).toBeInstanceOf(Array)
      expect(result.total).toBe(5)
      expect(result.data).toHaveLength(5)
    })

    it('should include follower details', async () => {
      const result = await client.follows.getFollowers()

      const follow = result.data[0]
      expect(follow.id).toBe('follow_2')
      expect(follow.follower_id).toBe('user_3')
      expect(follow.followee_id).toBe('user_1')
      expect(follow.follower).toBeDefined()
      expect(follow.follower?.first_name).toBe('Charlie')
      expect(follow.follower?.avatar_url).toBeDefined()
    })

    it('should support pagination with limit', async () => {
      const result = await client.follows.getFollowers({ limit: 3 })

      expect(result).toBeDefined()
      expect(result.data).toHaveLength(3)
      expect(result.total).toBe(5)
    })

    it('should support pagination with offset', async () => {
      const result = await client.follows.getFollowers({ limit: 2, offset: 3 })

      expect(result).toBeDefined()
      expect(result.data).toHaveLength(2)
      expect(result.total).toBe(5)
    })

    it('should return empty array when no followers', async () => {
      const result = await client.follows.getFollowers({ limit: 0 })

      expect(result).toBeDefined()
      expect(result.data).toBeInstanceOf(Array)
      expect(result.data).toHaveLength(0)
      expect(result.total).toBe(0)
    })
  })

  // ===== Follow Status =====

  describe('getStatus()', () => {
    it('should check if following a user', async () => {
      const result = await client.follows.getStatus('user_2')

      expect(result).toBeDefined()
      expect(result.isFollowing).toBe(true)
      expect(result.followId).toBe('follow_1')
    })

    it('should return false when not following', async () => {
      const result = await client.follows.getStatus('user_not_followed')

      expect(result).toBeDefined()
      expect(result.isFollowing).toBe(false)
      expect(result.followId).toBeUndefined()
    })

    it('should handle checking status for self', async () => {
      const result = await client.follows.getStatus('user_self')

      expect(result).toBeDefined()
      expect(result.isFollowing).toBe(false) // Cannot follow yourself
    })

    it('should handle non-existent users', async () => {
      await expect(
        client.follows.getStatus('user_nonexistent')
      ).rejects.toThrow()
    })
  })

  // ===== Edge Cases & Validation =====

  describe('validation', () => {
    it('should reject empty targetUserId', async () => {
      await expect(
        client.follows.followUser({ targetUserId: '' })
      ).rejects.toThrow()
    })

    it('should reject invalid userId format', async () => {
      await expect(
        client.follows.followUser({ targetUserId: 'invalid@format' })
      ).rejects.toThrow()
    })

    it('should handle negative pagination values', async () => {
      await expect(
        client.follows.getFollowing({ limit: -1 })
      ).rejects.toThrow()
    })

    it('should handle very large pagination limits', async () => {
      const result = await client.follows.getFollowing({ limit: 1000 })

      // Should cap at reasonable limit or return what's available
      expect(result.data.length).toBeLessThanOrEqual(100)
    })
  })

  // ===== Error Handling =====

  describe('error handling', () => {
    it('should handle 401 unauthorized', async () => {
      await expect(
        client.follows.followUser({ targetUserId: 'user_unauthorized' })
      ).rejects.toThrow()
    })

    it('should handle 404 not found', async () => {
      await expect(
        client.follows.getStatus('user_nonexistent')
      ).rejects.toThrow()
    })

    it('should handle 429 rate limit', { timeout: 15000 }, async () => {
      await expect(
        client.follows.followUser({ targetUserId: 'user_rate_limit' })
      ).rejects.toThrow()
    })

    it('should handle 500 server error', { timeout: 15000 }, async () => {
      await expect(
        client.follows.getFollowing({ limit: 999999 })
      ).rejects.toThrow()
    })

    it('should handle network errors', async () => {
      // Simulate network failure
      await expect(
        client.follows.followUser({ targetUserId: 'user_network_error' })
      ).rejects.toThrow()
    })
  })

  // ===== Privacy & Social Graph =====

  describe('privacy and social graph', () => {
    it('should respect blocked users', async () => {
      await expect(
        client.follows.followUser({ targetUserId: 'user_blocked' })
      ).rejects.toThrow()
    })

    it('should handle private profiles', async () => {
      // Following should work, but details might be limited
      const result = await client.follows.followUser({ targetUserId: 'user_private' })

      expect(result).toBeDefined()
      expect(result.followee).toBeDefined()
      // Some fields may be null for privacy
    })

    it('should not expose sensitive follower data', async () => {
      const result = await client.follows.getFollowers()

      result.data.forEach((follow) => {
        expect(follow.follower).toBeDefined()
        // Should not include email, phone, etc.
        expect(follow.follower).not.toHaveProperty('email')
        expect(follow.follower).not.toHaveProperty('phone')
      })
    })

    it('should handle deactivated users', async () => {
      await expect(
        client.follows.followUser({ targetUserId: 'user_deactivated' })
      ).rejects.toThrow()
    })
  })

  // ===== Performance & Scalability =====

  describe('performance', () => {
    it('should handle users with many followers efficiently', async () => {
      const start = Date.now()
      const result = await client.follows.getFollowers({ limit: 100 })
      const duration = Date.now() - start

      expect(result).toBeDefined()
      expect(duration).toBeLessThan(1000) // Should respond in < 1s
    })

    it('should handle users following many people efficiently', async () => {
      const start = Date.now()
      const result = await client.follows.getFollowing({ limit: 100 })
      const duration = Date.now() - start

      expect(result).toBeDefined()
      expect(duration).toBeLessThan(1000)
    })
  })
})
