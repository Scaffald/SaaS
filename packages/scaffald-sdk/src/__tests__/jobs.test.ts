import { describe, it, expect, beforeEach } from 'vitest'
import { Scaffald } from '../client.js'
import type { Job, JobListResponse } from '../resources/jobs.js'

describe('JobsResource', () => {
  let client: Scaffald

  beforeEach(() => {
    client = new Scaffald({
      apiKey: 'sk_test_mock_key_for_testing',
      baseUrl: 'http://localhost:54321/functions/v1/api',
    })
  })

  describe('constructor', () => {
    it('should create a client with API key', () => {
      expect(client).toBeDefined()
      expect(client.jobs).toBeDefined()
    })

    it('should create a client with access token', () => {
      const oauthClient = new Scaffald({
        accessToken: 'mock_oauth_token',
        baseUrl: 'http://localhost:54321/functions/v1/api',
      })
      expect(oauthClient).toBeDefined()
      expect(oauthClient.jobs).toBeDefined()
    })

    it('should throw error without credentials', () => {
      expect(() => {
        new Scaffald({
          baseUrl: 'http://localhost:54321/functions/v1/api',
        } as any)
      }).toThrow('Either apiKey or accessToken must be provided')
    })

    it('should throw error with both credentials', () => {
      expect(() => {
        new Scaffald({
          apiKey: 'sk_test_key',
          accessToken: 'oauth_token',
          baseUrl: 'http://localhost:54321/functions/v1/api',
        })
      }).toThrow('Cannot provide both apiKey and accessToken')
    })

    it('should throw error with invalid API key format', () => {
      expect(() => {
        new Scaffald({
          apiKey: 'invalid_key',
          baseUrl: 'http://localhost:54321/functions/v1/api',
        })
      }).toThrow('API key must start with "sk_"')
    })
  })

  describe('rate limit tracking', () => {
    it('should provide rate limit methods', () => {
      expect(client.getRateLimitInfo()).toBeNull()
      expect(client.isRateLimitApproaching()).toBe(false)
      expect(client.isRateLimitExceeded()).toBe(false)
      expect(client.getSecondsUntilRateLimitReset()).toBe(0)
    })

    it('should allow subscribing to rate limit updates', () => {
      const unsubscribe = client.onRateLimitUpdate((info) => {
        expect(info).toBeDefined()
      })
      expect(typeof unsubscribe).toBe('function')
      unsubscribe()
    })
  })

  // Note: Integration tests with MSW will be added in the next phase
  describe('jobs.list (unit)', () => {
    it('should have list method', () => {
      expect(typeof client.jobs.list).toBe('function')
    })
  })

  describe('jobs.retrieve (unit)', () => {
    it('should have retrieve method', () => {
      expect(typeof client.jobs.retrieve).toBe('function')
    })
  })

  describe('jobs.similar (unit)', () => {
    it('should have similar method', () => {
      expect(typeof client.jobs.similar).toBe('function')
    })
  })

  describe('jobs.filterOptions (unit)', () => {
    it('should have filterOptions method', () => {
      expect(typeof client.jobs.filterOptions).toBe('function')
    })
  })
})
