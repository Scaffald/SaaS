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

  // TODO: Implement these methods in ProfileCompletion resource
  describe.skip('getSection', () => {
    it('should get specific section details', async () => {
      // const result = await client.profileCompletion.getSection('work_experience')
      // expect(result.data).toBeDefined()
    })
  })

  describe.skip('getMissingSections', () => {
    it('should get incomplete sections', async () => {
      // const result = await client.profileCompletion.getMissingSections()
      // expect(result.data).toBeDefined()
    })
  })

  describe.skip('getSuggestions', () => {
    it('should get completion suggestions', async () => {
      // const result = await client.profileCompletion.getSuggestions()
      // expect(result.data).toBeDefined()
    })
  })

  describe.skip('getWeighting', () => {
    it('should get section weighting configuration', async () => {
      // const result = await client.profileCompletion.getWeighting()
      // expect(result.data).toBeDefined()
    })
  })

  describe.skip('recalculate', () => {
    it('should trigger recalculation of completion score', async () => {
      // const result = await client.profileCompletion.recalculate()
      // expect(result.data).toBeDefined()
    })
  })

  describe.skip('getHistory', () => {
    it('should get completion history over time', async () => {
      // const result = await client.profileCompletion.getHistory()
      // expect(result.data).toBeDefined()
    })
  })
})
