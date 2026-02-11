import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Scaffald } from '../client.js'
import type {
  Prerequisite,
  PrerequisitesResponse,
  PrerequisiteValidationResult,
} from '../resources/prerequisites.js'

describe('Prerequisites Resource', () => {
  let client: Scaffald
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockFetch = vi.fn()
    global.fetch = mockFetch
    client = new Scaffald({
      apiKey: 'test-api-key',
      baseURL: 'https://api.test.com',
    })
  })

  describe('list', () => {
    it('should list all prerequisites', async () => {
      const mockResponse: PrerequisitesResponse = {
        data: [
          {
            id: 'prereq_profile',
            name: 'Complete Profile',
            description: 'Fill out your basic profile information',
            category: 'profile',
            required: true,
            completed: true,
            completion_percentage: 100,
          },
          {
            id: 'prereq_resume',
            name: 'Upload Resume',
            description: 'Upload your resume or CV',
            category: 'documents',
            required: true,
            completed: false,
            completion_percentage: 0,
          },
          {
            id: 'prereq_skills',
            name: 'Add Skills',
            description: 'Add at least 5 skills to your profile',
            category: 'profile',
            required: false,
            completed: false,
            completion_percentage: 40,
          },
        ],
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockResponse,
      })

      const result = await client.prerequisites.list()

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/prerequisites',
        expect.any(Object)
      )
      expect(result.data).toHaveLength(3)
    })

    it('should filter by category', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: [] }),
      })

      await client.prerequisites.list({ category: 'profile' })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/prerequisites?category=profile',
        expect.any(Object)
      )
    })

    it('should filter by required status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: [] }),
      })

      await client.prerequisites.list({ required: true })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/prerequisites?required=true',
        expect.any(Object)
      )
    })

    it('should filter by completion status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: [] }),
      })

      await client.prerequisites.list({ completed: false })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/prerequisites?completed=false',
        expect.any(Object)
      )
    })
  })

  describe('get', () => {
    it('should get prerequisite by ID', async () => {
      const mockPrerequisite: Prerequisite = {
        id: 'prereq_profile',
        name: 'Complete Profile',
        description: 'Fill out your basic profile information',
        category: 'profile',
        required: true,
        completed: true,
        completion_percentage: 100,
        fields: [
          { name: 'first_name', completed: true },
          { name: 'last_name', completed: true },
          { name: 'email', completed: true },
        ],
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: mockPrerequisite }),
      })

      const result = await client.prerequisites.get('prereq_profile')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/prerequisites/prereq_profile',
        expect.any(Object)
      )
      expect(result.data.id).toBe('prereq_profile')
      expect(result.data.fields).toHaveLength(3)
    })

    it('should handle prerequisite not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ error: 'Prerequisite not found' }),
      })

      await expect(client.prerequisites.get('invalid_id')).rejects.toThrow()
    })
  })

  describe('check', () => {
    it('should check prerequisite completion status', async () => {
      const mockResult = {
        data: {
          prerequisite_id: 'prereq_profile',
          completed: true,
          completion_percentage: 100,
          missing_fields: [],
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockResult,
      })

      const result = await client.prerequisites.check('prereq_profile')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/prerequisites/prereq_profile/check',
        expect.any(Object)
      )
      expect(result.data.completed).toBe(true)
    })

    it('should return missing fields for incomplete prerequisite', async () => {
      const mockResult = {
        data: {
          prerequisite_id: 'prereq_profile',
          completed: false,
          completion_percentage: 60,
          missing_fields: ['phone', 'location'],
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockResult,
      })

      const result = await client.prerequisites.check('prereq_profile')

      expect(result.data.completed).toBe(false)
      expect(result.data.missing_fields).toHaveLength(2)
    })
  })

  describe('validate', () => {
    it('should validate all prerequisites', async () => {
      const mockValidation: PrerequisiteValidationResult = {
        valid: false,
        required_prerequisites_met: false,
        optional_prerequisites_met: true,
        missing_required: [
          {
            id: 'prereq_resume',
            name: 'Upload Resume',
            description: 'Upload your resume or CV',
            category: 'documents',
            required: true,
            completed: false,
            completion_percentage: 0,
          },
        ],
        missing_optional: [],
        completion_percentage: 75,
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: mockValidation }),
      })

      const result = await client.prerequisites.validate()

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/prerequisites/validate',
        expect.any(Object)
      )
      expect(result.data.valid).toBe(false)
      expect(result.data.missing_required).toHaveLength(1)
    })

    it('should validate for specific context', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          data: {
            valid: true,
            required_prerequisites_met: true,
            optional_prerequisites_met: true,
            missing_required: [],
            missing_optional: [],
            completion_percentage: 100,
          },
        }),
      })

      await client.prerequisites.validate({ context: 'job_application' })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/prerequisites/validate?context=job_application',
        expect.any(Object)
      )
    })

    it('should validate for specific job', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          data: {
            valid: true,
            required_prerequisites_met: true,
            optional_prerequisites_met: false,
            missing_required: [],
            missing_optional: [],
            completion_percentage: 100,
          },
        }),
      })

      await client.prerequisites.validate({ job_id: 'job_123' })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/prerequisites/validate?job_id=job_123',
        expect.any(Object)
      )
    })
  })

  describe('getMissing', () => {
    it('should get missing prerequisites', async () => {
      const mockMissing = {
        data: [
          {
            id: 'prereq_resume',
            name: 'Upload Resume',
            description: 'Upload your resume or CV',
            category: 'documents',
            required: true,
            completed: false,
            completion_percentage: 0,
          },
          {
            id: 'prereq_skills',
            name: 'Add Skills',
            description: 'Add at least 5 skills',
            category: 'profile',
            required: false,
            completed: false,
            completion_percentage: 40,
          },
        ],
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockMissing,
      })

      const result = await client.prerequisites.getMissing()

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/prerequisites/missing',
        expect.any(Object)
      )
      expect(result.data).toHaveLength(2)
    })

    it('should filter missing by required only', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: [] }),
      })

      await client.prerequisites.getMissing({ required_only: true })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/prerequisites/missing?required_only=true',
        expect.any(Object)
      )
    })

    it('should get missing for specific context', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: [] }),
      })

      await client.prerequisites.getMissing({ context: 'job_application' })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/prerequisites/missing?context=job_application',
        expect.any(Object)
      )
    })
  })

  describe('getCompletionStats', () => {
    it('should get overall completion statistics', async () => {
      const mockStats = {
        data: {
          total_prerequisites: 10,
          completed_prerequisites: 7,
          required_prerequisites: 5,
          required_completed: 4,
          optional_prerequisites: 5,
          optional_completed: 3,
          overall_completion_percentage: 70,
          required_completion_percentage: 80,
          optional_completion_percentage: 60,
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockStats,
      })

      const result = await client.prerequisites.getCompletionStats()

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/prerequisites/stats',
        expect.any(Object)
      )
      expect(result.data.overall_completion_percentage).toBe(70)
    })

    it('should get stats by category', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          data: {
            category: 'profile',
            total_prerequisites: 5,
            completed_prerequisites: 4,
            completion_percentage: 80,
          },
        }),
      })

      await client.prerequisites.getCompletionStats({ category: 'profile' })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/prerequisites/stats?category=profile',
        expect.any(Object)
      )
    })
  })

  describe('error handling', () => {
    it('should handle 401 unauthorized', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ error: 'Unauthorized' }),
      })

      await expect(client.prerequisites.list()).rejects.toThrow()
    })

    it('should handle 404 not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ error: 'Prerequisite not found' }),
      })

      await expect(client.prerequisites.get('invalid_id')).rejects.toThrow()
    })

    it('should handle 429 rate limit', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ error: 'Rate limit exceeded' }),
      })

      await expect(client.prerequisites.validate()).rejects.toThrow()
    })

    it('should handle 500 server error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ error: 'Internal server error' }),
      })

      await expect(client.prerequisites.check('prereq_profile')).rejects.toThrow()
    })
  })
})
