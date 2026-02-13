import { describe, it, expect } from 'vitest'
import { Scaffald } from '../client.js'

describe('Prerequisites Resource', () => {
  const client = new Scaffald({
    apiKey: 'sk_test_123',
  })

  describe('list', () => {
    it('should list all prerequisites', async () => {
      const result = await client.prerequisites.list()

      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
    })

    it('should filter by category', async () => {
      const result = await client.prerequisites.list({ category: 'profile' })

      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
    })

    it('should filter by required status', async () => {
      const result = await client.prerequisites.list({ required: true })

      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
    })

    it('should filter by completion status', async () => {
      const result = await client.prerequisites.list({ completed: false })

      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
    })
  })

  describe('getById', () => {
    it('should get prerequisite by ID', async () => {
      const result = await client.prerequisites.getById('prereq_profile')

      expect(result.data).toBeDefined()
      expect(result.data.id).toBe('prereq_profile')
    })

    it('should handle prerequisite not found', async () => {
      await expect(client.prerequisites.getById('invalid_id')).rejects.toThrow()
    })
  })

  describe('check', () => {
    it('should check all prerequisites', async () => {
      const result = await client.prerequisites.check()

      expect(result.data).toBeDefined()
    })
  })

  describe('checkPrerequisite', () => {
    it('should check specific prerequisite', async () => {
      const result = await client.prerequisites.checkPrerequisite('prereq_profile')

      expect(result.data).toBeDefined()
      expect(result.data.prerequisite_id).toBeDefined()
      expect(result.data.completed).toBeDefined()
      expect(result.data.completion_percentage).toBeDefined()
    })

    it('should return missing fields for incomplete prerequisite', async () => {
      const result = await client.prerequisites.checkPrerequisite('prereq_profile')

      expect(result.data).toBeDefined()
      expect(result.data.missing_fields).toBeDefined()
    })
  })

  describe('complete', () => {
    it('should mark prerequisite as complete', async () => {
      const result = await client.prerequisites.complete({ prerequisite_id: 'prereq_profile' })

      expect(result.data).toBeDefined()
    })
  })

  describe('validate', () => {
    it('should validate all prerequisites', async () => {
      const result = await client.prerequisites.validate()

      expect(result.data).toBeDefined()
      expect(result.data.valid).toBeDefined()
      expect(result.data.required_prerequisites_met).toBeDefined()
    })

    it('should validate for specific context', async () => {
      const result = await client.prerequisites.validate({ context: 'job_application' })

      expect(result.data).toBeDefined()
      expect(result.data.valid).toBeDefined()
    })

    it('should validate for specific job', async () => {
      const result = await client.prerequisites.validate({ job_id: 'job_123' })

      expect(result.data).toBeDefined()
      expect(result.data.valid).toBeDefined()
    })
  })

  describe('getMissing', () => {
    it('should get missing prerequisites', async () => {
      const result = await client.prerequisites.getMissing()

      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
    })

    it('should filter missing by required only', async () => {
      const result = await client.prerequisites.getMissing({ required_only: true })

      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
    })

    it('should get missing for specific context', async () => {
      const result = await client.prerequisites.getMissing({ context: 'job_application' })

      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
    })
  })

  describe('getCompletionStats', () => {
    it('should get overall completion statistics', async () => {
      const result = await client.prerequisites.getCompletionStats()

      expect(result.data).toBeDefined()
      expect(result.data.overall_completion_percentage).toBeDefined()
    })

    it('should get stats by category', async () => {
      const result = await client.prerequisites.getCompletionStats({ category: 'profile' })

      expect(result.data).toBeDefined()
    })
  })
})
