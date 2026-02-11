import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Scaffald } from '../client.js'
import type {
  Inquiry,
  InquiriesListResponse,
  CreateInquiryParams,
  RespondToInquiryParams,
} from '../resources/inquiries.js'

describe('Inquiries Resource', () => {
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

  describe('create', () => {
    it('should create a new inquiry', async () => {
      const params: CreateInquiryParams = {
        recipient_id: 'user_456',
        subject: 'Question about job posting',
        message: 'I would like to know more about the position.',
        inquiry_type: 'job_inquiry',
        job_id: 'job_789',
      }

      const mockInquiry: Inquiry = {
        id: 'inq_123',
        sender_id: 'user_123',
        recipient_id: 'user_456',
        subject: params.subject,
        message: params.message,
        inquiry_type: 'job_inquiry',
        job_id: 'job_789',
        status: 'pending',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: mockInquiry }),
      })

      const result = await client.inquiries.create(params)

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/inquiries',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(params),
        })
      )
      expect(result.data.subject).toBe(params.subject)
      expect(result.data.status).toBe('pending')
    })

    it('should create inquiry using template', async () => {
      const params: CreateInquiryParams = {
        recipient_id: 'user_456',
        template_id: 'tpl_123',
        job_id: 'job_789',
      }

      const mockInquiry: Inquiry = {
        id: 'inq_124',
        sender_id: 'user_123',
        recipient_id: 'user_456',
        subject: 'Interest in Position',
        message: 'Template message content',
        inquiry_type: 'job_inquiry',
        job_id: 'job_789',
        status: 'pending',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: mockInquiry }),
      })

      const result = await client.inquiries.create(params)

      expect(result.data.subject).toBe('Interest in Position')
    })

    it('should handle validation errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          error: 'Validation failed',
          details: { message: 'Message is required' },
        }),
      })

      await expect(
        client.inquiries.create({
          recipient_id: 'user_456',
          subject: 'Test',
        } as CreateInquiryParams)
      ).rejects.toThrow()
    })
  })

  describe('list', () => {
    it('should list sent inquiries', async () => {
      const mockResponse: InquiriesListResponse = {
        data: [
          {
            id: 'inq_1',
            sender_id: 'user_123',
            recipient_id: 'user_456',
            subject: 'Question 1',
            message: 'Message 1',
            inquiry_type: 'general',
            status: 'pending',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
          {
            id: 'inq_2',
            sender_id: 'user_123',
            recipient_id: 'user_789',
            subject: 'Question 2',
            message: 'Message 2',
            inquiry_type: 'job_inquiry',
            status: 'responded',
            created_at: '2024-01-02T00:00:00Z',
            updated_at: '2024-01-02T00:00:00Z',
          },
        ],
        pagination: {
          total: 2,
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

      const result = await client.inquiries.list({ direction: 'sent' })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/inquiries?direction=sent',
        expect.any(Object)
      )
      expect(result.data).toHaveLength(2)
    })

    it('should list received inquiries', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          data: [],
          pagination: { total: 0, page: 1, limit: 20, total_pages: 0 },
        }),
      })

      await client.inquiries.list({ direction: 'received' })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/inquiries?direction=received',
        expect.any(Object)
      )
    })

    it('should filter by status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          data: [],
          pagination: { total: 0, page: 1, limit: 20, total_pages: 0 },
        }),
      })

      await client.inquiries.list({ status: 'pending' })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/inquiries?status=pending',
        expect.any(Object)
      )
    })

    it('should filter by inquiry type', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          data: [],
          pagination: { total: 0, page: 1, limit: 20, total_pages: 0 },
        }),
      })

      await client.inquiries.list({ inquiry_type: 'job_inquiry' })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/inquiries?inquiry_type=job_inquiry',
        expect.any(Object)
      )
    })
  })

  describe('get', () => {
    it('should get inquiry by ID', async () => {
      const mockInquiry: Inquiry = {
        id: 'inq_123',
        sender_id: 'user_123',
        recipient_id: 'user_456',
        subject: 'Question',
        message: 'Message content',
        inquiry_type: 'general',
        status: 'pending',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: mockInquiry }),
      })

      const result = await client.inquiries.get('inq_123')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/inquiries/inq_123',
        expect.any(Object)
      )
      expect(result.data.id).toBe('inq_123')
    })

    it('should handle inquiry not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ error: 'Inquiry not found' }),
      })

      await expect(client.inquiries.get('invalid_id')).rejects.toThrow()
    })
  })

  describe('respond', () => {
    it('should respond to an inquiry', async () => {
      const params: RespondToInquiryParams = {
        message: 'Thank you for your interest. Here is more information...',
      }

      const mockInquiry: Inquiry = {
        id: 'inq_123',
        sender_id: 'user_456',
        recipient_id: 'user_123',
        subject: 'Question',
        message: 'Original message',
        inquiry_type: 'general',
        status: 'responded',
        response: params.message,
        responded_at: '2024-01-15T11:00:00Z',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T11:00:00Z',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: mockInquiry }),
      })

      const result = await client.inquiries.respond('inq_123', params)

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/inquiries/inq_123/respond',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(params),
        })
      )
      expect(result.data.status).toBe('responded')
      expect(result.data.response).toBe(params.message)
    })

    it('should handle already responded inquiry', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ error: 'Inquiry already responded' }),
      })

      await expect(
        client.inquiries.respond('inq_123', { message: 'Response' })
      ).rejects.toThrow()
    })
  })

  describe('templates', () => {
    it('should list inquiry templates', async () => {
      const mockTemplates = {
        data: [
          {
            id: 'tpl_1',
            name: 'Job Interest',
            subject: 'Interest in {{job_title}}',
            message: 'I am interested in the {{job_title}} position.',
            inquiry_type: 'job_inquiry',
          },
          {
            id: 'tpl_2',
            name: 'General Question',
            subject: 'Question about {{topic}}',
            message: 'I have a question about {{topic}}.',
            inquiry_type: 'general',
          },
        ],
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockTemplates,
      })

      const result = await client.inquiries.templates()

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/inquiries/templates',
        expect.any(Object)
      )
      expect(result.data).toHaveLength(2)
    })

    it('should filter templates by type', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: [] }),
      })

      await client.inquiries.templates({ inquiry_type: 'job_inquiry' })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/inquiries/templates?inquiry_type=job_inquiry',
        expect.any(Object)
      )
    })
  })

  describe('bulkMarkAsRead', () => {
    it('should mark multiple inquiries as read', async () => {
      const inquiryIds = ['inq_1', 'inq_2', 'inq_3']

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          data: { updated_count: 3 },
        }),
      })

      const result = await client.inquiries.bulkMarkAsRead(inquiryIds)

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/inquiries/bulk/mark-read',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ inquiry_ids: inquiryIds }),
        })
      )
      expect(result.data.updated_count).toBe(3)
    })

    it('should handle empty array', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          data: { updated_count: 0 },
        }),
      })

      const result = await client.inquiries.bulkMarkAsRead([])

      expect(result.data.updated_count).toBe(0)
    })
  })

  describe('bulkArchive', () => {
    it('should archive multiple inquiries', async () => {
      const inquiryIds = ['inq_1', 'inq_2']

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          data: { archived_count: 2 },
        }),
      })

      const result = await client.inquiries.bulkArchive(inquiryIds)

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/inquiries/bulk/archive',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ inquiry_ids: inquiryIds }),
        })
      )
      expect(result.data.archived_count).toBe(2)
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

      await expect(client.inquiries.list()).rejects.toThrow()
    })

    it('should handle 429 rate limit', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ error: 'Rate limit exceeded' }),
      })

      await expect(
        client.inquiries.create({
          recipient_id: 'user_456',
          subject: 'Test',
          message: 'Test',
          inquiry_type: 'general',
        })
      ).rejects.toThrow()
    })

    it('should handle 500 server error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ error: 'Internal server error' }),
      })

      await expect(client.inquiries.get('inq_123')).rejects.toThrow()
    })
  })
})
