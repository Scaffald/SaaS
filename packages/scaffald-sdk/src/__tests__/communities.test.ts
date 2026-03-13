import { describe, it, expect } from 'vitest'
import { Scaffald } from '../client'

describe('Communities Resource', () => {
  const client = new Scaffald({ apiKey: 'sk_test_123' })

  describe('communities', () => {
    it('should list communities', async () => {
      const response = await client.communities.list()
      expect(response).toHaveProperty('data')
      expect(Array.isArray(response.data)).toBe(true)
      expect(response.data[0]).toHaveProperty('slug')
      expect(response.data[0]).toHaveProperty('member_count')
    })

    it('should get community by slug', async () => {
      const response = await client.communities.getBySlug('electrical')
      expect(response.data).toHaveProperty('id')
      expect(response.data.slug).toBe('electrical')
    })

    it('should join a community', async () => {
      const response = await client.communities.join('comm_1')
      expect(response.success).toBe(true)
    })

    it('should leave a community', async () => {
      const response = await client.communities.leave('comm_1')
      expect(response.success).toBe(true)
    })
  })

  describe('communityPosts', () => {
    it('should get community feed', async () => {
      const response = await client.communityPosts.getCommunityFeed('comm_1')
      expect(response).toHaveProperty('data')
      expect(response).toHaveProperty('next_cursor')
      expect(Array.isArray(response.data)).toBe(true)
    })

    it('should get published feed', async () => {
      const response = await client.communityPosts.getPublishedFeed()
      expect(response.data).toBeDefined()
      expect(Array.isArray(response.data)).toBe(true)
    })

    it('should get user portfolio', async () => {
      const response = await client.communityPosts.getUserPortfolio('user_1')
      expect(response.data).toBeDefined()
    })

    it('should get post by id', async () => {
      const response = await client.communityPosts.getPost('post_1')
      expect(response.data).toHaveProperty('id')
      expect(response.data).toHaveProperty('title')
      expect(response.data).toHaveProperty('post_type')
    })

    it('should create a post', async () => {
      const response = await client.communityPosts.create({
        community_id: 'comm_1',
        post_type: 'showcase',
        title: 'Test Post',
        body: 'Test body',
      })
      expect(response.data).toHaveProperty('id')
      expect(response.data.title).toBe('Test Post')
    })

    it('should submit a post for moderation', async () => {
      const response = await client.communityPosts.submit('post_1')
      expect(response.data.status).toBe('published')
    })

    it('should publish a post to profile', async () => {
      const response = await client.communityPosts.publish('post_1')
      expect(response.data.is_published).toBe(true)
    })
  })

  describe('communityComments', () => {
    it('should list comments for a post', async () => {
      const response = await client.communityComments.list('post_1')
      expect(response).toHaveProperty('data')
      expect(response).toHaveProperty('total')
      expect(response.total).toBe(1)
    })

    it('should create a comment', async () => {
      const response = await client.communityComments.create('post_1', { body: 'Great work!' })
      expect(response.data).toHaveProperty('id')
      expect(response.data.body).toBe('Great work!')
    })
  })

  describe('communityRatings', () => {
    it('should rate a post', async () => {
      const response = await client.communityRatings.rate('post_1', {
        base_rating: 5,
        quality_rating: 4,
        technique_rating: 5,
        creativity_rating: 5,
      })
      expect(response.data).toHaveProperty('id')
      expect(response.data.base_rating).toBe(5)
    })

    it('should get rating summary', async () => {
      const response = await client.communityRatings.getSummary('post_1')
      expect(response.data).toHaveProperty('rating_avg')
      expect(response.data).toHaveProperty('rating_count')
      expect(response.data).toHaveProperty('distribution')
      expect(response.data.rating_avg).toBe(4.5)
    })
  })

  describe('communityInteractions', () => {
    it('should upvote', async () => {
      const response = await client.communityInteractions.upvote({
        target_type: 'post',
        target_id: 'post_1',
      })
      expect(response.success).toBe(true)
    })

    it('should bookmark', async () => {
      const response = await client.communityInteractions.bookmark('post_1')
      expect(response.data).toHaveProperty('id')
      expect(response.data).toHaveProperty('post_id')
    })
  })

  describe('communityReputation', () => {
    it('should get my score', async () => {
      const response = await client.communityReputation.getMyScore()
      expect(response.data).toHaveProperty('score')
      expect(response.data).toHaveProperty('karma_bank')
      expect(response.data.score).toBe(75)
    })

    it('should get user score', async () => {
      const response = await client.communityReputation.getUserScore('user_1')
      expect(response.data.score).toBe(75)
    })

    it('should gift karma', async () => {
      const response = await client.communityReputation.giftKarma({
        receiver_id: 'user_2',
        amount: 5,
        message: 'Great help!',
      })
      expect(response.success).toBe(true)
    })
  })

  describe('communitySkills', () => {
    it('should search skills', async () => {
      const response = await client.communitySkills.search({ q: 'panel' })
      expect(response).toHaveProperty('data')
      expect(Array.isArray(response.data)).toBe(true)
      expect(response.data[0]).toHaveProperty('name')
      expect(response.data[0]).toHaveProperty('tier')
    })
  })

  describe('officeCommunities', () => {
    it('should get verification queue', async () => {
      const response = await client.officeCommunities.getVerificationQueue()
      expect(response).toHaveProperty('data')
      expect(response).toHaveProperty('total')
      expect(response.total).toBe(1)
      expect(response.data[0]).toHaveProperty('membership_id')
      expect(response.data[0]).toHaveProperty('verification_data')
    })

    it('should approve verification', async () => {
      const response = await client.officeCommunities.approveVerification('mem_1')
      expect(response.success).toBe(true)
    })

    it('should reject verification', async () => {
      const response = await client.officeCommunities.rejectVerification('mem_1', 'Invalid license')
      expect(response.success).toBe(true)
    })
  })
})
