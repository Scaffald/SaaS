import { describe, it, expect } from 'vitest'
import { Scaffald } from '../client'

describe('Applications Resource', () => {
  const client = new Scaffald({
    apiKey: 'sk_test_123',
  })

  describe('create', () => {
    it('should create a new application', async () => {
      const newApplication = await client.applications.create({
        job_id: 'job_123',
        current_location: 'San Francisco, CA',
        willing_to_relocate: true,
        years_experience: 5,
        is_authorized_to_work: true,
        earliest_start_date: '2024-02-01',
        is_complete: true,
      })

      expect(newApplication).toHaveProperty('id')
      expect(newApplication.job_id).toBe('job_123')
      expect(newApplication.status).toBe('pending')
    })

    it('should create application with custom questions', async () => {
      const newApplication = await client.applications.create({
        job_id: 'job_123',
        current_location: 'New York, NY',
        willing_to_relocate: false,
        years_experience: 3,
        is_authorized_to_work: true,
        earliest_start_date: '2024-03-01',
        custom_question_answers: [
          {
            question_id: 'q1',
            question: 'Why do you want this job?',
            answer: 'I am passionate about this field',
            type: 'long_text',
          },
        ],
        is_complete: true,
      })

      expect(newApplication.custom_question_answers).toHaveLength(1)
    })
  })

  describe('retrieve', () => {
    it('should retrieve an application by id', async () => {
      const application = await client.applications.retrieve('app_123')

      expect(application).toHaveProperty('id')
      expect(application.id).toBe('app_123')
      expect(application).toHaveProperty('job_id')
      expect(application).toHaveProperty('status')
    })
  })

  describe('update', () => {
    it('should update an application', async () => {
      const updated = await client.applications.update('app_123', {
        status: 'reviewing',
        is_complete: true,
      })

      expect(updated).toHaveProperty('id')
      expect(updated.id).toBe('app_123')
    })

    it('should update application with new answers', async () => {
      const updated = await client.applications.update('app_123', {
        screening_answers: {
          question1: 'Updated answer',
        },
      })

      expect(updated.screening_answers).toBeDefined()
    })
  })

  describe('withdraw', () => {
    it('should withdraw an application', async () => {
      const withdrawn = await client.applications.withdraw('app_123')

      expect(withdrawn).toHaveProperty('id')
      expect(withdrawn.status).toBe('withdrawn')
    })

    it('should withdraw with reason', async () => {
      const withdrawn = await client.applications.withdraw('app_123', {
        reason: 'Accepted another offer',
      })

      expect(withdrawn.status).toBe('withdrawn')
    })
  })
})
