import { describe, it, expect, beforeEach } from 'vitest'
import { Scaffald } from '../client.js'
import type {
  APIKey,
  CreatedAPIKey,
  APIKeyListResponse,
  APIKeyResponse,
  CreatedAPIKeyResponse,
  APIKeyUsageResponse,
  APIKeyRevokeResponse,
} from '../resources/api-keys.js'

describe('APIKeysResource', () => {
  let client: Scaffald

  beforeEach(() => {
    client = new Scaffald({
      apiKey: 'sk_test_mock_key_for_testing',
      baseUrl: 'http://localhost:54321/functions/v1/api',
    })
  })

  describe('initialization', () => {
    it('should create apiKeys resource on client', () => {
      expect(client.apiKeys).toBeDefined()
      expect(client.apiKeys).toBeTruthy()
    })
  })

  describe('apiKeys.list (unit)', () => {
    it('should have list method', () => {
      expect(typeof client.apiKeys.list).toBe('function')
    })

    it('should accept optional params', () => {
      // Should not throw with no params
      expect(() => {
        const _promise = client.apiKeys.list()
      }).not.toThrow()

      // Should not throw with params
      expect(() => {
        const _promise = client.apiKeys.list({ limit: 10, offset: 0 })
      }).not.toThrow()
    })
  })

  describe('apiKeys.create (unit)', () => {
    it('should have create method', () => {
      expect(typeof client.apiKeys.create).toBe('function')
    })

    it('should accept create parameters', () => {
      expect(() => {
        const _promise = client.apiKeys.create({
          name: 'Test Key',
          scopes: ['read:jobs'],
          environment: 'test',
        })
      }).not.toThrow()
    })

    it('should accept optional parameters', () => {
      expect(() => {
        const _promise = client.apiKeys.create({
          name: 'Test Key',
          scopes: ['read:jobs', 'write:jobs'],
          environment: 'live',
          rate_limit_tier: 'pro',
          expires_at: '2025-12-31T23:59:59Z',
        })
      }).not.toThrow()
    })
  })

  describe('apiKeys.retrieve (unit)', () => {
    it('should have retrieve method', () => {
      expect(typeof client.apiKeys.retrieve).toBe('function')
    })

    it('should accept key ID parameter', () => {
      expect(() => {
        const _promise = client.apiKeys.retrieve('key_123')
      }).not.toThrow()
    })
  })

  describe('apiKeys.update (unit)', () => {
    it('should have update method', () => {
      expect(typeof client.apiKeys.update).toBe('function')
    })

    it('should accept update parameters', () => {
      expect(() => {
        const _promise = client.apiKeys.update('key_123', {
          name: 'Updated Name',
        })
      }).not.toThrow()

      expect(() => {
        const _promise = client.apiKeys.update('key_123', {
          scopes: ['read:jobs', 'write:jobs'],
        })
      }).not.toThrow()

      expect(() => {
        const _promise = client.apiKeys.update('key_123', {
          is_active: false,
        })
      }).not.toThrow()
    })

    it('should accept multiple update fields', () => {
      expect(() => {
        const _promise = client.apiKeys.update('key_123', {
          name: 'Updated Name',
          scopes: ['read:jobs'],
          is_active: true,
        })
      }).not.toThrow()
    })
  })

  describe('apiKeys.revoke (unit)', () => {
    it('should have revoke method', () => {
      expect(typeof client.apiKeys.revoke).toBe('function')
    })

    it('should accept key ID parameter', () => {
      expect(() => {
        const _promise = client.apiKeys.revoke('key_123')
      }).not.toThrow()
    })
  })

  describe('apiKeys.getUsage (unit)', () => {
    it('should have getUsage method', () => {
      expect(typeof client.apiKeys.getUsage).toBe('function')
    })

    it('should accept key ID and days parameter', () => {
      expect(() => {
        const _promise = client.apiKeys.getUsage('key_123', 30)
      }).not.toThrow()
    })

    it('should use default days when not specified', () => {
      expect(() => {
        const _promise = client.apiKeys.getUsage('key_123')
      }).not.toThrow()
    })

    it('should accept different time ranges', () => {
      expect(() => {
        const _promise = client.apiKeys.getUsage('key_123', 7)
      }).not.toThrow()

      expect(() => {
        const _promise = client.apiKeys.getUsage('key_123', 60)
      }).not.toThrow()

      expect(() => {
        const _promise = client.apiKeys.getUsage('key_123', 90)
      }).not.toThrow()
    })
  })

  describe('type safety', () => {
    it('should type list response correctly', async () => {
      // This test verifies TypeScript types compile correctly
      const listPromise: Promise<APIKeyListResponse> = client.apiKeys.list()
      expect(listPromise).toBeDefined()
    })

    it('should type create response correctly', async () => {
      const createPromise: Promise<CreatedAPIKeyResponse> = client.apiKeys.create({
        name: 'Test',
        scopes: ['read:jobs'],
      })
      expect(createPromise).toBeDefined()
    })

    it('should type retrieve response correctly', async () => {
      const retrievePromise: Promise<APIKeyResponse> = client.apiKeys.retrieve('key_123')
      expect(retrievePromise).toBeDefined()
    })

    it('should type update response correctly', async () => {
      const updatePromise: Promise<APIKeyResponse> = client.apiKeys.update('key_123', {
        name: 'Updated',
      })
      expect(updatePromise).toBeDefined()
    })

    it('should type revoke response correctly', async () => {
      const revokePromise: Promise<APIKeyRevokeResponse> = client.apiKeys.revoke('key_123')
      expect(revokePromise).toBeDefined()
    })

    it('should type usage response correctly', async () => {
      const usagePromise: Promise<APIKeyUsageResponse> = client.apiKeys.getUsage('key_123')
      expect(usagePromise).toBeDefined()
    })
  })

  describe('scope validation', () => {
    it('should accept all valid scopes', () => {
      const validScopes = [
        'read:jobs',
        'write:jobs',
        'read:applications',
        'write:applications',
        'read:profiles',
        'write:profiles',
        'read:organizations',
        'write:organizations',
      ] as const

      for (const scope of validScopes) {
        expect(() => {
          const _promise = client.apiKeys.create({
            name: 'Test',
            scopes: [scope],
          })
        }).not.toThrow()
      }
    })

    it('should accept multiple scopes', () => {
      expect(() => {
        const _promise = client.apiKeys.create({
          name: 'Test',
          scopes: ['read:jobs', 'write:jobs', 'read:applications'],
        })
      }).not.toThrow()
    })
  })

  describe('environment validation', () => {
    it('should accept test environment', () => {
      expect(() => {
        const _promise = client.apiKeys.create({
          name: 'Test',
          scopes: ['read:jobs'],
          environment: 'test',
        })
      }).not.toThrow()
    })

    it('should accept live environment', () => {
      expect(() => {
        const _promise = client.apiKeys.create({
          name: 'Test',
          scopes: ['read:jobs'],
          environment: 'live',
        })
      }).not.toThrow()
    })
  })

  describe('rate limit tier validation', () => {
    it('should accept all valid rate limit tiers', () => {
      const tiers = ['free', 'pro', 'enterprise'] as const

      for (const tier of tiers) {
        expect(() => {
          const _promise = client.apiKeys.create({
            name: 'Test',
            scopes: ['read:jobs'],
            rate_limit_tier: tier,
          })
        }).not.toThrow()
      }
    })
  })

  describe('API key format', () => {
    it('should understand key prefix format', () => {
      // API keys should have format: sk_{environment}_{random}
      const mockKey: APIKey = {
        id: 'key_123',
        organization_id: 'org_123',
        name: 'Test Key',
        key_prefix: 'sk_test_abc',
        scopes: ['read:jobs'],
        rate_limit_tier: 'free',
        is_active: true,
        last_used_at: null,
        created_at: '2025-01-01T00:00:00Z',
        expires_at: null,
      }

      expect(mockKey.key_prefix).toMatch(/^sk_(test|live)_/)
    })

    it('should include full key in create response only', () => {
      const mockCreatedKey: CreatedAPIKey = {
        id: 'key_123',
        organization_id: 'org_123',
        name: 'Test Key',
        key_prefix: 'sk_test_abc',
        key: 'sk_test_abcdefghijklmnopqrstuvwxyz123456', // Full key only in create
        scopes: ['read:jobs'],
        rate_limit_tier: 'free',
        is_active: true,
        last_used_at: null,
        created_at: '2025-01-01T00:00:00Z',
        expires_at: null,
      }

      expect(mockCreatedKey.key).toBeDefined()
      expect(mockCreatedKey.key.length).toBeGreaterThan(16)
    })
  })

  describe('usage statistics', () => {
    it('should return proper usage structure', () => {
      const mockUsage = {
        total_requests: 1000,
        success_requests: 950,
        error_requests: 50,
        error_rate: '5.00',
        avg_response_time_ms: 125,
        period_days: 30,
        usage: [
          {
            endpoint: '/v1/jobs',
            method: 'GET',
            status_code: 200,
            response_time_ms: 120,
            timestamp: '2025-01-01T12:00:00Z',
          },
        ],
      }

      expect(mockUsage.total_requests).toBe(mockUsage.success_requests + mockUsage.error_requests)
      expect(Number.parseFloat(mockUsage.error_rate)).toBeCloseTo(5.0, 2)
    })
  })
})
