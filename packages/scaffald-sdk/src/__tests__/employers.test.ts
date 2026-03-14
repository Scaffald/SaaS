import { describe, expect, it } from 'vitest'
import { Scaffald } from '../client.js'

describe('Employers Resource', () => {
  const client = new Scaffald({
    apiKey: 'sk_test_123',
  })

  describe('getById', () => {
    it('should fetch employer profile by ID', async () => {
      const result = await client.employers.getById({ id: 'emp_123' })

      expect(result).toBeDefined()
      expect(result.id).toBe('emp_123')
      expect(result.name).toBeDefined()
    })

    it('should handle employer not found', async () => {
      await expect(client.employers.getById({ id: 'invalid_id' })).rejects.toThrow()
    })
  })

  describe('list', () => {
    it('should list employers with pagination', async () => {
      const result = await client.employers.list({ limit: 20, offset: 0 })

      expect(result.employers).toBeDefined()
      expect(Array.isArray(result.employers)).toBe(true)
      expect(result.total).toBeDefined()
    })

    it('should filter employers by industry', async () => {
      const result = await client.employers.list({ industry: 'Technology' })

      expect(result.employers).toBeDefined()
      expect(result.total).toBeDefined()
    })

    it('should filter with search query', async () => {
      const result = await client.employers.list({ search: 'Tech' })

      expect(result.employers).toBeDefined()
      expect(result.total).toBeDefined()
    })
  })

  describe('error handling', () => {
    it('should handle not found error', async () => {
      await expect(client.employers.getById({ id: 'invalid_id' })).rejects.toThrow()
    })
  })
})
