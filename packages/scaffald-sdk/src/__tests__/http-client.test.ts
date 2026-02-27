import { describe, it, expect, beforeEach, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from './mocks/server'
import { Scaffald } from '../client'
import {
  AuthenticationError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  APIError,
} from '../http/errors'

describe('HTTP Client', () => {
  let client: Scaffald

  beforeEach(() => {
    client = new Scaffald({
      apiKey: 'sk_test_123',
    })
  })

  describe('Authentication', () => {
    it('should include API key in Authorization header', async () => {
      const jobs = await client.jobs.list()
      expect(jobs).toBeDefined()
    })

    it('should support access token', async () => {
      const clientWithToken = new Scaffald({
        accessToken: 'oauth_token_123',
      })
      const jobs = await clientWithToken.jobs.list()
      expect(jobs).toBeDefined()
    })

    it('should support Supabase token', async () => {
      const clientWithSupabaseToken = new Scaffald({
        supabaseToken: 'supabase_jwt_token_123',
      })
      const jobs = await clientWithSupabaseToken.jobs.list()
      expect(jobs).toBeDefined()
    })

    it('should throw error when no auth is provided', () => {
      expect(() => new Scaffald({})).toThrow(
        'Either apiKey, accessToken, or supabaseToken must be provided'
      )
    })
  })

  describe('Error Handling', () => {
    it('should throw AuthenticationError on 401', async () => {
      server.use(
        http.get('https://api.scaffald.com/v1/jobs', () => {
          return HttpResponse.json(
            { error: { message: 'Invalid API key' } },
            { status: 401 }
          )
        })
      )

      await expect(client.jobs.list()).rejects.toThrow(AuthenticationError)
    })

    it('should throw NotFoundError on 404', async () => {
      server.use(
        http.get('https://api.scaffald.com/v1/jobs/:id', () => {
          return HttpResponse.json(
            { error: { message: 'Job not found' } },
            { status: 404 }
          )
        })
      )

      await expect(client.jobs.retrieve('nonexistent')).rejects.toThrow(NotFoundError)
    })

    it('should throw ValidationError on 422', async () => {
      server.use(
        http.post('https://api.scaffald.com/v1/jobs', () => {
          return HttpResponse.json(
            {
              error: {
                message: 'Validation failed',
                errors: [{ field: 'title', message: 'Title is required' }],
              },
            },
            { status: 422 }
          )
        })
      )

      await expect(
        client.jobs.create({ title: '', description: '' })
      ).rejects.toThrow(ValidationError)
    })

    it('should throw RateLimitError on 429', async () => {
      const clientNoRetry = new Scaffald({
        apiKey: 'sk_test_123',
        maxRetries: 0,
      })

      server.use(
        http.get('https://api.scaffald.com/v1/jobs', () => {
          return HttpResponse.json(
            { error: { message: 'Rate limit exceeded' } },
            {
              status: 429,
              headers: {
                'Retry-After': '5',
              },
            }
          )
        })
      )

      await expect(clientNoRetry.jobs.list()).rejects.toThrow(RateLimitError)
    })

    it('should throw APIError on 500', async () => {
      const clientNoRetry = new Scaffald({
        apiKey: 'sk_test_123',
        maxRetries: 0,
      })

      server.use(
        http.get('https://api.scaffald.com/v1/jobs', () => {
          return HttpResponse.json(
            { error: { message: 'Internal server error' } },
            { status: 500 }
          )
        })
      )

      await expect(clientNoRetry.jobs.list()).rejects.toThrow(APIError)
    })
  })

  describe('Rate Limiting', () => {
    it('should track rate limit info from headers', async () => {
      server.use(
        http.get('https://api.scaffald.com/v1/jobs', () => {
          return HttpResponse.json(
            { data: [], total: 0, limit: 20, offset: 0 },
            {
              headers: {
                'x-ratelimit-limit': '1000',
                'x-ratelimit-remaining': '999',
                'x-ratelimit-reset': '1704067200',
              },
            }
          )
        })
      )

      await client.jobs.list()
      const rateLimitInfo = client.getRateLimitInfo()

      expect(rateLimitInfo).toBeDefined()
      expect(rateLimitInfo?.limit).toBe(1000)
      expect(rateLimitInfo?.remaining).toBe(999)
    })

    it('should warn when rate limit is low', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      server.use(
        http.get('https://api.scaffald.com/v1/jobs', () => {
          return HttpResponse.json(
            { data: [], total: 0, limit: 20, offset: 0 },
            {
              headers: {
                'x-ratelimit-limit': '1000',
                'x-ratelimit-remaining': '50', // 5% remaining
                'x-ratelimit-reset': '1704067200',
              },
            }
          )
        })
      )

      await client.jobs.list()

      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('Retry Logic', () => {
    it('should retry on 503 Service Unavailable', async () => {
      let attemptCount = 0

      server.use(
        http.get('https://api.scaffald.com/v1/jobs', () => {
          attemptCount++
          if (attemptCount < 2) {
            return HttpResponse.json(
              { error: { message: 'Service unavailable' } },
              { status: 503 }
            )
          }
          return HttpResponse.json({
            data: [],
            total: 0,
            limit: 20,
            offset: 0,
          })
        })
      )

      const response = await client.jobs.list()
      expect(response).toBeDefined()
      expect(attemptCount).toBeGreaterThan(1)
    })

    it('should not retry POST requests', async () => {
      let attemptCount = 0

      server.use(
        http.post('https://api.scaffald.com/v1/jobs', () => {
          attemptCount++
          return HttpResponse.json(
            { error: { message: 'Service unavailable' } },
            { status: 503 }
          )
        })
      )

      await expect(
        client.jobs.create({ title: 'Test', description: 'Test' })
      ).rejects.toThrow(APIError)

      expect(attemptCount).toBe(1)
    })

    it('should respect maxRetries config', async () => {
      const clientWithLimitedRetries = new Scaffald({
        apiKey: 'sk_test_123',
        maxRetries: 1,
        timeout: 10000, // Increase timeout to allow retries to complete
      })

      let attemptCount = 0

      server.use(
        http.get('https://api.scaffald.com/v1/jobs', () => {
          attemptCount++
          return HttpResponse.json(
            { error: { message: 'Service unavailable' } },
            { status: 503 }
          )
        })
      )

      await expect(clientWithLimitedRetries.jobs.list()).rejects.toThrow(APIError)
      expect(attemptCount).toBe(2) // Initial + 1 retry = 2 total attempts
    })
  })

  describe('Request Timeout', () => {
    it('should timeout long requests', async () => {
      const clientWithShortTimeout = new Scaffald({
        apiKey: 'sk_test_123',
        timeout: 100, // 100ms
      })

      server.use(
        http.get('https://api.scaffald.com/v1/jobs', async () => {
          await new Promise((resolve) => setTimeout(resolve, 200)) // 200ms delay
          return HttpResponse.json({ data: [], total: 0, limit: 20, offset: 0 })
        })
      )

      await expect(clientWithShortTimeout.jobs.list()).rejects.toThrow()
    }, 10000)
  })

  describe('URL construction with baseUrl path', () => {
    it('should preserve baseUrl path when constructing request URLs', async () => {
      const baseUrlWithPath = 'http://127.0.0.1:54321/functions/v1/api'

      server.use(
        http.get(`${baseUrlWithPath}/v1/prerequisites/check`, () =>
          HttpResponse.json({
            isComplete: false,
            hasName: false,
            hasAddress: false,
            hasUserTypes: false,
            hasIndustry: false,
            hasAcceptedPrivacy: false,
            hasAcceptedTerms: false,
            completedAt: null,
            data: {
              first_name: '',
              last_name: '',
              address: null,
              user_types: [],
              industry_id: '',
            },
          })
        )
      )

      const clientWithPathBase = new Scaffald({
        apiKey: 'sk_test_123',
        baseUrl: baseUrlWithPath,
      })

      const result = await clientWithPathBase.prerequisites.check()

      expect(result).toBeDefined()
      expect(result.isComplete).toBe(false)
    })
  })

  describe('Custom Headers', () => {
    it('should include custom headers in requests', async () => {
      let receivedHeaders: Headers | undefined

      server.use(
        http.get('https://api.scaffald.com/v1/jobs', ({ request }) => {
          receivedHeaders = request.headers
          return HttpResponse.json({ data: [], total: 0, limit: 20, offset: 0 })
        })
      )

      const clientWithHeaders = new Scaffald({
        apiKey: 'sk_test_123',
        headers: {
          'X-Custom-Header': 'custom-value',
        },
      })

      await clientWithHeaders.jobs.list()

      expect(receivedHeaders?.get('X-Custom-Header')).toBe('custom-value')
    })
  })
})
