import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Scaffald } from '../client.js'
import type { Employer, EmployersListResponse } from '../resources/employers.js'

describe('Employers Resource', () => {
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

  describe('get', () => {
    it('should fetch employer profile by ID', async () => {
      const mockEmployer: Employer = {
        id: 'emp_123',
        organization_name: 'Acme Corp',
        industry: 'Technology',
        size: '100-500',
        website: 'https://acme.com',
        logo_url: 'https://cdn.acme.com/logo.png',
        verified: true,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: mockEmployer }),
      })

      const result = await client.employers.get('emp_123')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/employers/emp_123',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-api-key',
          }),
        })
      )
      expect(result.data).toEqual(mockEmployer)
    })

    it('should handle employer not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ error: 'Employer not found' }),
      })

      await expect(client.employers.get('invalid_id')).rejects.toThrow()
    })
  })

  describe('list', () => {
    it('should list employers with pagination', async () => {
      const mockResponse: EmployersListResponse = {
        data: [
          {
            id: 'emp_1',
            organization_name: 'Tech Co',
            industry: 'Technology',
            size: '50-100',
            verified: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
          {
            id: 'emp_2',
            organization_name: 'Finance Ltd',
            industry: 'Finance',
            size: '100-500',
            verified: false,
            created_at: '2024-01-02T00:00:00Z',
            updated_at: '2024-01-02T00:00:00Z',
          },
        ],
        pagination: {
          total: 50,
          page: 1,
          limit: 20,
          total_pages: 3,
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockResponse,
      })

      const result = await client.employers.list({ page: 1, limit: 20 })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/employers?page=1&limit=20',
        expect.any(Object)
      )
      expect(result.data).toHaveLength(2)
      expect(result.pagination?.total).toBe(50)
    })

    it('should filter employers by industry', async () => {
      const mockResponse: EmployersListResponse = {
        data: [
          {
            id: 'emp_1',
            organization_name: 'Tech Co',
            industry: 'Technology',
            size: '50-100',
            verified: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ],
        pagination: {
          total: 1,
          page: 1,
          limit: 20,
          total_pages: 1,
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockResponse,
      })

      const result = await client.employers.list({ industry: 'Technology' })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/employers?industry=Technology',
        expect.any(Object)
      )
      expect(result.data[0].industry).toBe('Technology')
    })

    it('should filter verified employers only', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          data: [],
          pagination: { total: 0, page: 1, limit: 20, total_pages: 0 },
        }),
      })

      await client.employers.list({ verified: true })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/employers?verified=true',
        expect.any(Object)
      )
    })
  })

  describe('search', () => {
    it('should search employers by query', async () => {
      const mockResponse: EmployersListResponse = {
        data: [
          {
            id: 'emp_1',
            organization_name: 'Acme Corporation',
            industry: 'Technology',
            size: '100-500',
            verified: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ],
        pagination: {
          total: 1,
          page: 1,
          limit: 20,
          total_pages: 1,
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockResponse,
      })

      const result = await client.employers.search({ query: 'Acme' })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/employers/search?query=Acme',
        expect.any(Object)
      )
      expect(result.data[0].organization_name).toContain('Acme')
    })

    it('should handle empty search results', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          data: [],
          pagination: { total: 0, page: 1, limit: 20, total_pages: 0 },
        }),
      })

      const result = await client.employers.search({ query: 'nonexistent' })

      expect(result.data).toHaveLength(0)
      expect(result.pagination?.total).toBe(0)
    })

    it('should combine search with filters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          data: [],
          pagination: { total: 0, page: 1, limit: 20, total_pages: 0 },
        }),
      })

      await client.employers.search({
        query: 'tech',
        industry: 'Technology',
        verified: true,
      })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/employers/search?query=tech&industry=Technology&verified=true',
        expect.any(Object)
      )
    })
  })

  describe('getVerificationStatus', () => {
    it('should get employer verification status', async () => {
      const mockStatus = {
        employer_id: 'emp_123',
        verified: true,
        verification_date: '2024-01-15T10:00:00Z',
        verification_method: 'email_domain',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: mockStatus }),
      })

      const result = await client.employers.getVerificationStatus('emp_123')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/employers/emp_123/verification',
        expect.any(Object)
      )
      expect(result.data.verified).toBe(true)
    })

    it('should handle unverified employer', async () => {
      const mockStatus = {
        employer_id: 'emp_456',
        verified: false,
        verification_date: null,
        verification_method: null,
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: mockStatus }),
      })

      const result = await client.employers.getVerificationStatus('emp_456')

      expect(result.data.verified).toBe(false)
      expect(result.data.verification_date).toBeNull()
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

      await expect(client.employers.list()).rejects.toThrow()
    })

    it('should handle 429 rate limit', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ error: 'Rate limit exceeded' }),
      })

      await expect(client.employers.search({ query: 'test' })).rejects.toThrow()
    })

    it('should handle 500 server error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ error: 'Internal server error' }),
      })

      await expect(client.employers.get('emp_123')).rejects.toThrow()
    })
  })
})
