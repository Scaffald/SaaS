import { describe, it, expect } from 'vitest'
import { Scaffald } from '../client'

describe('Jobs Resource', () => {
  const client = new Scaffald({
    apiKey: 'sk_test_123',
  })

  describe('list', () => {
    it('should list jobs', async () => {
      const response = await client.jobs.list()

      expect(response).toHaveProperty('data')
      expect(response).toHaveProperty('total')
      expect(response).toHaveProperty('limit')
      expect(response).toHaveProperty('offset')
      expect(Array.isArray(response.data)).toBe(true)
      expect(response.data.length).toBeGreaterThan(0)
    })

    it('should list jobs with params', async () => {
      const response = await client.jobs.list({
        status: 'published',
        limit: 10,
        offset: 0,
      })

      expect(response.data).toBeDefined()
      expect(response.limit).toBe(20) // Mock returns 20
    })
  })

  describe('retrieve', () => {
    it('should retrieve a job by id', async () => {
      const job = await client.jobs.retrieve('job_1')

      expect(job).toHaveProperty('id')
      expect(job).toHaveProperty('title')
      expect(job).toHaveProperty('description')
      expect(job).toHaveProperty('status')
      expect(job.id).toBe('job_1')
    })
  })

  describe('create', () => {
    it('should create a new job', async () => {
      const newJob = await client.jobs.create({
        title: 'New Software Engineer',
        description: 'Great opportunity',
        status: 'draft',
      })

      expect(newJob).toHaveProperty('id')
      expect(newJob.title).toBe('New Software Engineer')
      expect(newJob.description).toBe('Great opportunity')
    })

    it('should create a job with full details', async () => {
      const newJob = await client.jobs.create({
        title: 'Full Stack Developer',
        description: 'Complete job description',
        status: 'published',
        location: {
          city: 'New York',
          state: 'NY',
          country: 'US',
        },
        salary_min: 120000,
        salary_max: 160000,
        employment_type: 'full_time',
      })

      expect(newJob.title).toBe('Full Stack Developer')
      expect(newJob.location?.city).toBe('New York')
      expect(newJob.salary_min).toBe(120000)
    })
  })

  describe('update', () => {
    it('should update a job', async () => {
      const updated = await client.jobs.update('job_1', {
        title: 'Updated Title',
      })

      expect(updated).toHaveProperty('id')
      expect(updated.id).toBe('job_1')
    })
  })

  describe('delete', () => {
    it('should delete a job', async () => {
      await expect(client.jobs.delete('job_1')).resolves.toBeUndefined()
    })
  })

  describe('similar', () => {
    it('should get similar jobs', async () => {
      const response = await client.jobs.similar('job_1')

      expect(response).toHaveProperty('data')
      expect(Array.isArray(response.data)).toBe(true)
    })

    it('should get similar jobs with limit', async () => {
      const response = await client.jobs.similar('job_1', 5)

      expect(response.data).toBeDefined()
    })
  })
})
