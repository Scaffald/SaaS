import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { Scaffald } from '../client.js'
import { server } from './mocks/server.js'
import { http, HttpResponse } from 'msw'

describe('Experience', () => {
  let client: Scaffald

  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' })
    client = new Scaffald({
      apiKey: 'test_key',
      baseUrl: 'https://api.scaffald.com',
      maxRetries: 0,
    })
  })

  afterEach(() => {
    server.resetHandlers()
  })

  afterAll(() => {
    server.close()
  })

  // ===== Get Experience =====

  describe('getExperience()', () => {
    it('should get experience entries for current user', async () => {
      const result = await client.experience.getExperience()

      expect(result).toBeDefined()
      expect(result).toBeInstanceOf(Array)
    })

    it('should include full experience entry details', async () => {
      const result = await client.experience.getExperience()

      if (result.length > 0) {
        const entry = result[0]
        expect(entry.id).toBeDefined()
        expect(entry.job_title).toBeDefined()
        expect(entry.company_name).toBeDefined()
        expect(entry.is_remote).toBeDefined()
        expect(entry.is_current).toBeDefined()
      }
    })

    it('should handle empty experience list', async () => {
      server.use(
        http.get('*/v1/profiles/experience', () => {
          return HttpResponse.json([])
        })
      )

      const result = await client.experience.getExperience()
      expect(result).toHaveLength(0)
    })
  })

  // ===== Get Experience Summary =====

  describe('getExperienceSummary()', () => {
    it('should get experience summary', async () => {
      const result = await client.experience.getExperienceSummary()

      expect(result).toBeDefined()
      expect(result).toHaveProperty('career_level')
    })

    it('should return career level information', async () => {
      server.use(
        http.get('*/v1/profiles/experience/summary', () => {
          return HttpResponse.json({ career_level: 'senior' })
        })
      )

      const result = await client.experience.getExperienceSummary()
      expect(result.career_level).toBe('senior')
    })

    it('should handle null career level', async () => {
      server.use(
        http.get('*/v1/profiles/experience/summary', () => {
          return HttpResponse.json({ career_level: null })
        })
      )

      const result = await client.experience.getExperienceSummary()
      expect(result.career_level).toBeNull()
    })
  })

  // ===== Save Experience =====

  describe('saveExperience()', () => {
    it('should save experience entries', async () => {
      const result = await client.experience.saveExperience({
        career_level: 'senior',
        experience_entries: [
          {
            job_title: 'Senior Developer',
            company_name: 'Acme Corp',
            is_remote: true,
            is_current: true,
            start_date: '2022-01-15',
            description: 'Full-stack development',
          },
        ],
      })

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.experience_entries).toBeInstanceOf(Array)
    })

    it('should save multiple experience entries', async () => {
      const result = await client.experience.saveExperience({
        experience_entries: [
          {
            job_title: 'Senior Developer',
            company_name: 'Acme Corp',
            is_remote: true,
            is_current: true,
          },
          {
            job_title: 'Developer',
            company_name: 'Previous Co',
            is_remote: false,
            is_current: false,
            start_date: '2018-01-01',
            end_date: '2021-12-31',
          },
        ],
      })

      expect(result).toBeDefined()
      expect(result.experience_entries).toHaveLength(2)
    })

    it('should save experience with address location', async () => {
      const result = await client.experience.saveExperience({
        experience_entries: [
          {
            job_title: 'Developer',
            company_name: 'Local Corp',
            is_remote: false,
            is_current: true,
            location: {
              street: '123 Main St',
              city: 'San Francisco',
              state: 'CA',
              zip: '94102',
              country: 'USA',
            },
          },
        ],
      })

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
    })

    it('should validate required fields', async () => {
      server.use(
        http.post('*/v1/profiles/experience', () => {
          return HttpResponse.json(
            { error: 'job_title is required' },
            { status: 400 }
          )
        })
      )

      await expect(
        client.experience.saveExperience({
          experience_entries: [
            {
              job_title: '',
              company_name: 'Acme Corp',
              is_remote: false,
              is_current: false,
            },
          ],
        })
      ).rejects.toThrow()
    })
  })

  // ===== Delete Experience =====

  describe('deleteExperience()', () => {
    it('should delete an experience entry', async () => {
      const result = await client.experience.deleteExperience({
        experienceId: 'exp_123',
      })

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
    })

    it('should handle invalid experience ID', async () => {
      server.use(
        http.post('*/v1/profiles/experience/delete', () => {
          return HttpResponse.json(
            { error: 'Experience entry not found' },
            { status: 404 }
          )
        })
      )

      await expect(
        client.experience.deleteExperience({ experienceId: 'invalid' })
      ).rejects.toThrow()
    })

    it('should require experienceId parameter', async () => {
      server.use(
        http.post('*/v1/profiles/experience/delete', () => {
          return HttpResponse.json(
            { error: 'experienceId is required' },
            { status: 400 }
          )
        })
      )

      await expect(
        client.experience.deleteExperience({ experienceId: '' })
      ).rejects.toThrow()
    })
  })

  // ===== Error Handling =====

  describe('error handling', () => {
    it('should handle authentication errors', async () => {
      server.use(
        http.get('*/v1/profiles/experience', () => {
          return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
        })
      )

      await expect(client.experience.getExperience()).rejects.toThrow()
    })

    it('should handle rate limiting', async () => {
      server.use(
        http.get('*/v1/profiles/experience', () => {
          return HttpResponse.json(
            { error: 'Rate limit exceeded' },
            { status: 429, headers: { 'Retry-After': '60' } }
          )
        })
      )

      await expect(client.experience.getExperience()).rejects.toThrow()
    })

    it('should handle server errors', async () => {
      server.use(
        http.get('*/v1/profiles/experience', () => {
          return HttpResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
          )
        })
      )

      await expect(client.experience.getExperience()).rejects.toThrow()
    })

    it('should handle validation errors on save', async () => {
      server.use(
        http.post('*/v1/profiles/experience', () => {
          return HttpResponse.json(
            { error: 'Invalid date format' },
            { status: 400 }
          )
        })
      )

      await expect(
        client.experience.saveExperience({
          experience_entries: [
            {
              job_title: 'Developer',
              company_name: 'Acme',
              is_remote: false,
              is_current: false,
              start_date: 'invalid-date',
            },
          ],
        })
      ).rejects.toThrow()
    })
  })
})
