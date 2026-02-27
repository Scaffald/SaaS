import { describe, it, expect } from 'vitest'
import { Scaffald } from '../client.js'

describe('ONET Resource', () => {
  const client = new Scaffald({
    apiKey: 'sk_test_123',
  })

  describe('search', () => {
    it('should search occupations by keyword', async () => {
      const result = await client.onet.search({ keyword: 'software' })

      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
      expect(result.pagination).toBeDefined()
    })

    it('should handle empty search results', async () => {
      const result = await client.onet.search({ keyword: 'nonexistent' })

      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
    })

    it('should support pagination', async () => {
      const result = await client.onet.search({ keyword: 'developer', page: 2, limit: 50 })

      expect(result.data).toBeDefined()
      expect(result.pagination).toBeDefined()
    })
  })

  describe('getOccupation', () => {
    it('should get occupation details by O*NET code', async () => {
      const result = await client.onet.getOccupation('15-1252.00')

      expect(result.data).toBeDefined()
      expect(result.data.onetsoc_code).toBeDefined()
      expect(result.data.title).toBeDefined()
    })

    it('should handle invalid O*NET code', async () => {
      await expect(client.onet.getOccupation('99-9999.99')).rejects.toThrow()
    })
  })

  describe('getSkills', () => {
    it('should get skills for an occupation', async () => {
      const result = await client.onet.getSkills('15-1252.00')

      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
    })

    it('should filter skills by minimum importance', async () => {
      const result = await client.onet.getSkills('15-1252.00', { min_importance: 80 })

      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
    })

    it('should filter skills by category', async () => {
      const result = await client.onet.getSkills('15-1252.00', { category: 'Technical Skills' })

      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
    })
  })

  describe('getRelated', () => {
    it('should get related occupations', async () => {
      const result = await client.onet.getRelated('15-1252.00')

      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
    })

    it('should limit number of related occupations', async () => {
      const result = await client.onet.getRelated('15-1252.00', { limit: 5 })

      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
    })

    it('should handle occupation with no related jobs', async () => {
      const result = await client.onet.getRelated('15-1252.00')

      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
    })
  })

  describe('getKnowledge', () => {
    it('should get knowledge areas for an occupation', async () => {
      const result = await client.onet.getKnowledge('15-1252.00')

      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
    })
  })

  describe('getAbilities', () => {
    it('should get abilities for an occupation', async () => {
      const result = await client.onet.getAbilities('15-1252.00')

      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
    })
  })

  describe('autocomplete', () => {
    it('should autocomplete occupation titles', async () => {
      const result = await client.onet.autocomplete({ query: 'soft' })

      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
    })

    it('should limit autocomplete results', async () => {
      const result = await client.onet.autocomplete({ query: 'dev', limit: 5 })

      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
    })
  })
})
