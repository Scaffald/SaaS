import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { Scaffald } from '../client.js'
import { server } from './mocks/server.js'
import { http, HttpResponse } from 'msw'

describe('Education', () => {
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

  // ===== Get Education =====

  describe('getEducation()', () => {
    it('should get education entries for current user', async () => {
      const result = await client.education.getEducation()

      expect(result).toBeDefined()
      expect(result).toBeInstanceOf(Array)
    })

    it('should include full education entry details', async () => {
      const result = await client.education.getEducation()

      if (result.length > 0) {
        const entry = result[0]
        expect(entry.id).toBeDefined()
        expect(entry.institution_name).toBeDefined()
      }
    })

    it('should handle empty education list', async () => {
      server.use(
        http.get('*/v1/profiles/education', () => {
          return HttpResponse.json([])
        })
      )

      const result = await client.education.getEducation()
      expect(result).toHaveLength(0)
    })
  })

  // ===== Get Education Level =====

  describe('getEducationLevel()', () => {
    it('should get education level', async () => {
      const result = await client.education.getEducationLevel()

      expect(result).toBeDefined()
      expect(result).toHaveProperty('education_level')
    })

    it('should return education level information', async () => {
      server.use(
        http.get('*/v1/profiles/education/level', () => {
          return HttpResponse.json({ education_level: 'bachelor' })
        })
      )

      const result = await client.education.getEducationLevel()
      expect(result.education_level).toBe('bachelor')
    })

    it('should handle null education level', async () => {
      server.use(
        http.get('*/v1/profiles/education/level', () => {
          return HttpResponse.json({ education_level: null })
        })
      )

      const result = await client.education.getEducationLevel()
      expect(result.education_level).toBeNull()
    })
  })

  // ===== Save Education =====

  describe('saveEducation()', () => {
    it('should save education entries', async () => {
      const result = await client.education.saveEducation({
        education_level: 'bachelor',
        education_entries: [
          {
            institution_name: 'University of Example',
            degree_type: 'Bachelor of Science',
            field_of_study: 'Computer Science',
            start_date: '2018-09-01',
            end_date: '2022-05-15',
            is_current: false,
            gpa: 3.8,
          },
        ],
      })

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.education_entries).toBeInstanceOf(Array)
    })

    it('should save multiple education entries', async () => {
      const result = await client.education.saveEducation({
        education_entries: [
          {
            institution_name: 'University A',
            degree_type: 'Bachelor of Science',
            field_of_study: 'Computer Science',
            is_current: false,
          },
          {
            institution_name: 'University B',
            degree_type: 'Master of Science',
            field_of_study: 'Data Science',
            is_current: true,
          },
        ],
      })

      expect(result).toBeDefined()
      expect(result.education_entries).toHaveLength(2)
    })

    it('should save current education with expected graduation', async () => {
      const result = await client.education.saveEducation({
        education_entries: [
          {
            institution_name: 'State University',
            degree_type: 'PhD',
            field_of_study: 'Physics',
            is_current: true,
            start_date: '2023-09-01',
            expected_graduation_date: '2027-05-15',
          },
        ],
      })

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
    })

    it('should save education with custom degree type', async () => {
      const result = await client.education.saveEducation({
        education_entries: [
          {
            institution_name: 'Tech Institute',
            custom_degree_type: 'Professional Certificate',
            field_of_study: 'Web Development',
            is_current: false,
          },
        ],
      })

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
    })

    it('should validate required fields', async () => {
      server.use(
        http.post('*/v1/profiles/education', () => {
          return HttpResponse.json(
            { error: 'institution_name is required' },
            { status: 400 }
          )
        })
      )

      await expect(
        client.education.saveEducation({
          education_entries: [
            {
              institution_name: '',
            },
          ],
        })
      ).rejects.toThrow()
    })

    it('should validate GPA range', async () => {
      server.use(
        http.post('*/v1/profiles/education', () => {
          return HttpResponse.json(
            { error: 'GPA must be between 0 and 4.0' },
            { status: 400 }
          )
        })
      )

      await expect(
        client.education.saveEducation({
          education_entries: [
            {
              institution_name: 'University',
              gpa: 5.0,
            },
          ],
        })
      ).rejects.toThrow()
    })
  })

  // ===== Delete Education =====

  describe('deleteEducation()', () => {
    it('should delete an education entry', async () => {
      const result = await client.education.deleteEducation({
        educationId: 'edu_123',
      })

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
    })

    it('should handle invalid education ID', async () => {
      server.use(
        http.post('*/v1/profiles/education/delete', () => {
          return HttpResponse.json(
            { error: 'Education entry not found' },
            { status: 404 }
          )
        })
      )

      await expect(
        client.education.deleteEducation({ educationId: 'invalid' })
      ).rejects.toThrow()
    })

    it('should require educationId parameter', async () => {
      server.use(
        http.post('*/v1/profiles/education/delete', () => {
          return HttpResponse.json(
            { error: 'educationId is required' },
            { status: 400 }
          )
        })
      )

      await expect(
        client.education.deleteEducation({ educationId: '' })
      ).rejects.toThrow()
    })
  })

  // ===== Error Handling =====

  describe('error handling', () => {
    it('should handle authentication errors', async () => {
      server.use(
        http.get('*/v1/profiles/education', () => {
          return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
        })
      )

      await expect(client.education.getEducation()).rejects.toThrow()
    })

    it('should handle rate limiting', async () => {
      server.use(
        http.get('*/v1/profiles/education', () => {
          return HttpResponse.json(
            { error: 'Rate limit exceeded' },
            { status: 429, headers: { 'Retry-After': '60' } }
          )
        })
      )

      await expect(client.education.getEducation()).rejects.toThrow()
    })

    it('should handle server errors', async () => {
      server.use(
        http.get('*/v1/profiles/education', () => {
          return HttpResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
          )
        })
      )

      await expect(client.education.getEducation()).rejects.toThrow()
    })

    it('should handle validation errors on save', async () => {
      server.use(
        http.post('*/v1/profiles/education', () => {
          return HttpResponse.json(
            { error: 'Invalid date format' },
            { status: 400 }
          )
        })
      )

      await expect(
        client.education.saveEducation({
          education_entries: [
            {
              institution_name: 'University',
              start_date: 'invalid-date',
            },
          ],
        })
      ).rejects.toThrow()
    })
  })
})
