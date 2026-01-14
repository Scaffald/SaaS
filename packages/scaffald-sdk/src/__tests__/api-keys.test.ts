import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { Scaffald } from '../client.js'
import { server } from './mocks/server.js'

describe('API Keys Resource', () => {
  let client: Scaffald

  beforeAll(() => server.listen())
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())

  beforeAll(() => {
    client = new Scaffald({
      accessToken: 'test_token',
    })
  })

  describe('list()', () => {
    it('should list all API keys for organization', async () => {
      const keys = await client.apiKeys.list()

      expect(keys).toBeDefined()
      expect(Array.isArray(keys)).toBe(true)
      expect(keys.length).toBeGreaterThan(0)

      const firstKey = keys[0]
      expect(firstKey).toHaveProperty('id')
      expect(firstKey).toHaveProperty('name')
      expect(firstKey).toHaveProperty('key_prefix')
      expect(firstKey).toHaveProperty('scopes')
      expect(firstKey).toHaveProperty('rate_limit_tier')
      expect(firstKey).toHaveProperty('is_active')
      expect(firstKey).toHaveProperty('created_at')
    })

    it('should include key metadata', async () => {
      const keys = await client.apiKeys.list()

      const prodKey = keys.find((k) => k.name === 'Production API Key')
      expect(prodKey).toBeDefined()
      expect(prodKey?.key_prefix).toBe('sk_live_abc123...')
      expect(prodKey?.scopes).toContain('read:jobs')
      expect(prodKey?.scopes).toContain('write:applications')
      expect(prodKey?.rate_limit_tier).toBe('pro')
      expect(prodKey?.is_active).toBe(true)
    })

    it('should include inactive keys', async () => {
      const keys = await client.apiKeys.list()

      const revokedKey = keys.find((k) => k.name === 'Revoked Key')
      expect(revokedKey).toBeDefined()
      expect(revokedKey?.is_active).toBe(false)
    })
  })

  describe('create()', () => {
    it('should create a new API key', async () => {
      const newKey = await client.apiKeys.create({
        name: 'Test API Key',
        environment: 'live',
        scopes: ['read:jobs', 'write:applications'],
        rate_limit_tier: 'pro',
      })

      expect(newKey).toBeDefined()
      expect(newKey.id).toBe('key_new_123')
      expect(newKey.name).toBe('Test API Key')
      expect(newKey.key).toBeDefined()
      expect(newKey.key).toContain('sk_live_')
      expect(newKey.key_prefix).toBe('sk_live_abc123...')
      expect(newKey.scopes).toContain('read:jobs')
      expect(newKey.scopes).toContain('write:applications')
      expect(newKey.rate_limit_tier).toBe('pro')
    })

    it('should create key with test environment', async () => {
      const newKey = await client.apiKeys.create({
        name: 'Test Key',
        environment: 'test',
        scopes: ['read:jobs'],
      })

      expect(newKey).toBeDefined()
      expect(newKey.name).toBe('Test Key')
      expect(newKey.key).toBeDefined()
    })

    it('should create key with expiration date', async () => {
      const expiresAt = '2026-12-31T23:59:59Z'
      const newKey = await client.apiKeys.create({
        name: 'Expiring Key',
        scopes: ['read:jobs'],
        expires_at: expiresAt,
      })

      expect(newKey).toBeDefined()
      expect(newKey.expires_at).toBe(expiresAt)
    })

    it('should require at least one scope', async () => {
      await expect(
        client.apiKeys.create({
          name: 'Invalid Key',
          scopes: [], // Empty scopes should fail
        })
      ).rejects.toThrow()
    })
  })

  describe('update()', () => {
    it('should update API key name', async () => {
      const updated = await client.apiKeys.update('key_1', {
        name: 'Updated Key Name',
      })

      expect(updated).toBeDefined()
      expect(updated.id).toBe('key_1')
      expect(updated.name).toBe('Updated Key Name')
    })

    it('should update API key scopes', async () => {
      const updated = await client.apiKeys.update('key_1', {
        scopes: ['read:jobs', 'write:jobs', 'read:applications'],
      })

      expect(updated).toBeDefined()
      expect(updated.scopes).toContain('read:jobs')
      expect(updated.scopes).toContain('write:jobs')
      expect(updated.scopes).toContain('read:applications')
    })

    it('should activate/deactivate API key', async () => {
      const deactivated = await client.apiKeys.update('key_1', {
        is_active: false,
      })

      expect(deactivated).toBeDefined()
      expect(deactivated.is_active).toBe(false)

      const reactivated = await client.apiKeys.update('key_1', {
        is_active: true,
      })

      expect(reactivated).toBeDefined()
      expect(reactivated.is_active).toBe(true)
    })

    it('should update multiple fields at once', async () => {
      const updated = await client.apiKeys.update('key_1', {
        name: 'Multi-Update Key',
        scopes: ['read:jobs', 'write:jobs'],
        is_active: true,
      })

      expect(updated).toBeDefined()
      expect(updated.name).toBe('Multi-Update Key')
      expect(updated.scopes.length).toBeGreaterThan(0)
      expect(updated.is_active).toBe(true)
    })
  })

  describe('revoke()', () => {
    it('should revoke an API key', async () => {
      const result = await client.apiKeys.revoke('key_1')

      expect(result).toBeDefined()
      expect(result.id).toBe('key_1')
      expect(result.name).toBe('Production API Key')
      expect(result.message).toBe('API key revoked successfully')
    })

    it('should return success message on revocation', async () => {
      const result = await client.apiKeys.revoke('key_2')

      expect(result).toBeDefined()
      expect(result.message).toContain('revoked successfully')
    })
  })

  describe('getUsage()', () => {
    it('should get usage statistics for default period (30 days)', async () => {
      const stats = await client.apiKeys.getUsage('key_1')

      expect(stats).toBeDefined()
      expect(stats.total_requests).toBe(1250)
      expect(stats.success_requests).toBe(1180)
      expect(stats.error_requests).toBe(70)
      expect(stats.error_rate).toBe('5.60')
      expect(stats.avg_response_time_ms).toBe(245)
      expect(stats.period_days).toBe(30)
      expect(stats.usage).toBeDefined()
      expect(Array.isArray(stats.usage)).toBe(true)
    })

    it('should get usage statistics for custom period', async () => {
      const stats = await client.apiKeys.getUsage('key_1', { days: 7 })

      expect(stats).toBeDefined()
      expect(stats.period_days).toBe(7)
      expect(stats.total_requests).toBeDefined()
    })

    it('should include individual usage records', async () => {
      const stats = await client.apiKeys.getUsage('key_1')

      expect(stats.usage.length).toBeGreaterThan(0)

      const firstRecord = stats.usage[0]
      expect(firstRecord).toHaveProperty('endpoint')
      expect(firstRecord).toHaveProperty('method')
      expect(firstRecord).toHaveProperty('status_code')
      expect(firstRecord).toHaveProperty('response_time_ms')
      expect(firstRecord).toHaveProperty('timestamp')
    })

    it('should calculate statistics correctly', async () => {
      const stats = await client.apiKeys.getUsage('key_1')

      // Verify error rate calculation
      const expectedErrorRate = (stats.error_requests / stats.total_requests) * 100
      expect(Number.parseFloat(stats.error_rate)).toBeCloseTo(expectedErrorRate, 2)

      // Verify totals
      expect(stats.success_requests + stats.error_requests).toBeLessThanOrEqual(
        stats.total_requests
      )
    })

    it('should include different HTTP methods in usage records', async () => {
      const stats = await client.apiKeys.getUsage('key_1')

      const methods = new Set(stats.usage.map((r) => r.method))
      expect(methods.size).toBeGreaterThan(0)
    })

    it('should include different status codes in usage records', async () => {
      const stats = await client.apiKeys.getUsage('key_1')

      const successRecord = stats.usage.find((r) => r.status_code >= 200 && r.status_code < 300)
      const errorRecord = stats.usage.find((r) => r.status_code >= 400)

      expect(successRecord).toBeDefined()
      expect(errorRecord).toBeDefined()
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid API key ID on update', async () => {
      await expect(
        client.apiKeys.update('invalid_key_id', {
          name: 'Test',
        })
      ).rejects.toThrow()
    })

    it('should handle invalid API key ID on revoke', async () => {
      await expect(client.apiKeys.revoke('invalid_key_id')).rejects.toThrow()
    })

    it('should handle invalid API key ID on getUsage', async () => {
      await expect(client.apiKeys.getUsage('invalid_key_id')).rejects.toThrow()
    })
  })
})
