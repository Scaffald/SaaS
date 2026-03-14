import { describe, expect, it } from 'vitest'
import { Scaffald } from '../client.js'

describe('ProfileCompletion Resource', () => {
  const client = new Scaffald({
    apiKey: 'sk_test_123',
  })

  describe('getStatus', () => {
    it('should get profile completion status', async () => {
      const result = await client.profileCompletion.getStatus()

      expect(result).toBeDefined()
      expect(result.completionPercentage).toBeDefined()
      expect(result.sectionProgress).toBeDefined()
      expect(Array.isArray(result.sectionProgress)).toBe(true)
    })
  })

  describe('dismissNudge', () => {
    it('should dismiss a profile completion nudge', async () => {
      const result = await client.profileCompletion.dismissNudge({
        nudgeId: 'nudge_123',
        reason: 'not_interested',
      })

      expect(result).toBeDefined()
      expect(result.success).toBeDefined()
    })
  })

  describe('getPersonalizedBenefits', () => {
    it('should get personalized benefits messaging', async () => {
      const result = await client.profileCompletion.getPersonalizedBenefits()

      expect(result).toBeDefined()
      expect(result.benefits).toBeDefined()
      expect(Array.isArray(result.benefits)).toBe(true)
    })
  })
})
