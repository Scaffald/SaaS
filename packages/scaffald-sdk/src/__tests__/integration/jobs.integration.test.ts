import { describe, it, expect, beforeEach } from 'vitest'
import { Scaffald } from '../../client.js'

describe('Jobs Integration Tests', () => {
  let client: Scaffald

  beforeEach(() => {
    client = new Scaffald({
      apiKey: 'sk_test_integration_testing',
      baseUrl: 'http://localhost:54321/functions/v1/api',
    })
  })

  describe('list()', () => {
    it('should list jobs', async () => {
      const response = await client.jobs.list()

      expect(response.data).toHaveLength(2)
      expect(response.data[0]).toMatchObject({
        id: 'job_1',
        title: 'Senior Software Engineer',
        status: 'published',
        location: 'San Francisco, CA',
      })

      expect(response.pagination).toMatchObject({
        limit: 20,
        offset: 0,
        total: 2,
        has_more: false,
      })
    })

    it('should support pagination', async () => {
      const response = await client.jobs.list({ limit: 1, offset: 1 })

      expect(response.pagination.limit).toBe(1)
      expect(response.pagination.offset).toBe(1)
    })

    it('should filter by parameters', async () => {
      const response = await client.jobs.list({
        status: 'published',
        location: 'San Francisco',
        remote_option: 'hybrid',
      })

      expect(response.data.every(job => job.status === 'published')).toBe(true)
    })
  })

  describe('retrieve()', () => {
    it('should retrieve a specific job', async () => {
      const response = await client.jobs.retrieve('job_1')

      expect(response.data).toMatchObject({
        id: 'job_1',
        title: 'Senior Software Engineer',
        description: expect.stringContaining('looking for'),
      })
    })

    it('should handle not found errors', async () => {
      await expect(
        client.jobs.retrieve('not_found')
      ).rejects.toThrow('Job not found')
    })
  })

  describe('similar()', () => {
    it('should get similar jobs', async () => {
      const response = await client.jobs.similar('job_1')

      expect(response.data).toHaveLength(1)
      expect(response.data[0]).toMatchObject({
        id: 'job_3',
        title: 'Staff Software Engineer',
      })
    })

    it('should support limit parameter', async () => {
      const response = await client.jobs.similar('job_1', { limit: 5 })

      expect(response.data.length).toBeLessThanOrEqual(5)
    })
  })

  describe('filterOptions()', () => {
    it('should get filter options', async () => {
      const response = await client.jobs.filterOptions()

      expect(response.data).toMatchObject({
        employment_types: expect.arrayContaining(['full_time', 'part_time']),
        remote_options: expect.arrayContaining(['on_site', 'hybrid', 'remote']),
        locations: expect.arrayContaining(['San Francisco, CA']),
      })
    })
  })
})
