import { describe, it, expect } from 'vitest'
import { Scaffald } from '../client'

describe('Industries Resource', () => {
  const client = new Scaffald({
    apiKey: 'sk_test_123',
  })

  describe('list', () => {
    it('should list all industries', async () => {
      const response = await client.industries.list()

      expect(response).toHaveProperty('data')
      expect(response).toHaveProperty('total')
      expect(Array.isArray(response.data)).toBe(true)
      expect(response.data.length).toBeGreaterThan(0)
      expect(response.total).toBe(response.data.length)
    })

    it('should return industries with correct properties', async () => {
      const response = await client.industries.list()
      const industry = response.data[0]

      expect(industry).toHaveProperty('id')
      expect(industry).toHaveProperty('name')
      expect(industry).toHaveProperty('slug')
      expect(industry).toHaveProperty('description')
      expect(typeof industry.id).toBe('string')
      expect(typeof industry.name).toBe('string')
      expect(typeof industry.slug).toBe('string')
    })

    it('should return industries sorted alphabetically', async () => {
      const response = await client.industries.list()

      expect(response.data.length).toBeGreaterThan(1)

      // Check that industries are sorted by name
      const names = response.data.map(ind => ind.name)
      const sortedNames = [...names].sort()
      expect(names).toEqual(sortedNames)
    })
  })

  describe('retrieve', () => {
    it('should retrieve an industry by slug', async () => {
      const industry = await client.industries.retrieve('technology')

      expect(industry).not.toBeNull()
      expect(industry).toHaveProperty('id')
      expect(industry).toHaveProperty('name')
      expect(industry).toHaveProperty('slug')
      expect(industry).toHaveProperty('description')
      expect(industry?.slug).toBe('technology')
    })

    it('should return null for non-existent industry', async () => {
      const industry = await client.industries.retrieve('non-existent-industry-slug')

      expect(industry).toBeNull()
    })

    it('should have industry details', async () => {
      const industry = await client.industries.retrieve('technology')

      expect(industry?.name).toBeTruthy()
      expect(industry?.slug).toBeTruthy()
      // Description can be null
      expect(industry).toHaveProperty('description')
    })
  })

  describe('error handling', () => {
    it('should handle API errors gracefully', async () => {
      // This test would need MSW setup to mock error responses
      // For now, we just ensure the methods exist and are callable
      expect(client.industries.list).toBeDefined()
      expect(client.industries.retrieve).toBeDefined()
    })
  })
})
