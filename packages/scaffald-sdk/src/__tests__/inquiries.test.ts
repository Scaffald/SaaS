import { describe, it, expect } from 'vitest'
import { Scaffald } from '../client.js'
import type {
  CreateInquiryParams,
  RespondToInquiryParams,
} from '../resources/inquiries.js'

describe('Inquiries Resource', () => {
  const client = new Scaffald({
    apiKey: 'sk_test_123',
  })

  describe('list', () => {
    it('should list sent inquiries', async () => {
      const result = await client.inquiries.list({ direction: 'sent' })

      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
      expect(result.pagination).toBeDefined()
    })

    it('should list received inquiries', async () => {
      const result = await client.inquiries.list({ direction: 'received' })

      expect(result.data).toBeDefined()
      expect(result.pagination).toBeDefined()
    })

    it('should filter by status', async () => {
      const result = await client.inquiries.list({ status: 'pending' })

      expect(result.data).toBeDefined()
      expect(result.pagination).toBeDefined()
    })

    it('should filter by inquiry type', async () => {
      const result = await client.inquiries.list({ inquiry_type: 'job_inquiry' })

      expect(result.data).toBeDefined()
      expect(result.pagination).toBeDefined()
    })
  })

  describe('getById', () => {
    it('should get inquiry by ID', async () => {
      const result = await client.inquiries.getById('inq_123')

      expect(result.data).toBeDefined()
      expect(result.data.id).toBe('inq_123')
    })

    it('should handle inquiry not found', async () => {
      await expect(client.inquiries.getById('invalid_id')).rejects.toThrow()
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

      const result = await client.inquiries.create(params)

      expect(result.data).toBeDefined()
      expect(result.data.subject).toBeDefined()
      expect(result.data.status).toBeDefined()
    })

    it('should create inquiry using template', async () => {
      const params: CreateInquiryParams = {
        recipient_id: 'user_456',
        template_id: 'tpl_123',
        job_id: 'job_789',
      }

      const result = await client.inquiries.create(params)

      expect(result.data).toBeDefined()
      expect(result.data.subject).toBeDefined()
    })

    it('should handle validation errors', async () => {
      await expect(
        client.inquiries.create({
          recipient_id: 'user_456',
          subject: 'Test',
        } as CreateInquiryParams)
      ).rejects.toThrow()
    })
  })

  describe('respond', () => {
    it('should respond to an inquiry', async () => {
      const params: RespondToInquiryParams = {
        message: 'Thank you for your interest. Here is more information...',
      }

      const result = await client.inquiries.respond('inq_123', params)

      expect(result.data).toBeDefined()
      expect(result.data.status).toBeDefined()
      expect(result.data.response).toBeDefined()
    })
  })

  describe('templates', () => {
    it('should list inquiry templates', async () => {
      const result = await client.inquiries.templates()

      expect(result).toBeDefined()
      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
      expect(result.data.length).toBeGreaterThanOrEqual(0)
    })

    it('should filter templates by type', async () => {
      const result = await client.inquiries.templates({ inquiry_type: 'job_inquiry' })

      expect(result).toBeDefined()
      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
    })
  })

  describe('bulkMarkAsRead', () => {
    it('should mark multiple inquiries as read', async () => {
      const inquiryIds = ['inq_1', 'inq_2', 'inq_3']

      const result = await client.inquiries.bulkMarkAsRead(inquiryIds)

      expect(result.data).toBeDefined()
      expect(result.data.updated_count).toBeDefined()
    })

    it('should handle empty array', async () => {
      const result = await client.inquiries.bulkMarkAsRead([])

      expect(result.data).toBeDefined()
      expect(result.data.updated_count).toBeDefined()
    })
  })

  describe('bulkArchive', () => {
    it('should archive multiple inquiries', async () => {
      const inquiryIds = ['inq_1', 'inq_2']

      const result = await client.inquiries.bulkArchive(inquiryIds)

      expect(result.data).toBeDefined()
      expect(result.data.archived_count).toBeDefined()
    })
  })
})
