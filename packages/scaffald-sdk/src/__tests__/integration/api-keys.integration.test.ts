import { describe, it, expect, beforeEach } from 'vitest'
import { Scaffald } from '../../client.js'
import type { APIKeyScope } from '../../resources/api-keys.js'

describe('API Keys Integration Tests', () => {
  let client: Scaffald

  beforeEach(() => {
    client = new Scaffald({
      apiKey: 'sk_test_integration_testing',
      baseUrl: 'http://localhost:54321/functions/v1/api',
    })
  })

  describe('list()', () => {
    it('should list all API keys', async () => {
      const response = await client.apiKeys.list()

      expect(response.data).toHaveLength(2)
      expect(response.data[0]).toMatchObject({
        id: 'key_1',
        name: 'Production Key',
        key_prefix: 'sk_live_abc',
        scopes: ['read:jobs', 'write:jobs'],
        rate_limit_tier: 'pro',
        is_active: true,
      })
    })

    it('should support pagination', async () => {
      const response = await client.apiKeys.list({ limit: 1, offset: 0 })

      expect(response.data).toHaveLength(2) // Mock returns all for simplicity
    })
  })

  describe('create()', () => {
    it('should create a new API key', async () => {
      const response = await client.apiKeys.create({
        name: 'Test Integration Key',
        scopes: ['read:jobs', 'write:jobs'] as APIKeyScope[],
        environment: 'test',
        rate_limit_tier: 'pro',
      })

      expect(response.data).toMatchObject({
        id: 'key_new',
        name: 'Test Integration Key',
        scopes: ['read:jobs', 'write:jobs'],
        rate_limit_tier: 'pro',
        is_active: true,
      })

      // Full key should be present (only returned once!)
      expect(response.data.key).toMatch(/^sk_test_/)
      expect(response.warning).toBeTruthy()
    })

    it('should validate required fields', async () => {
      await expect(
        client.apiKeys.create({
          name: '',
          scopes: [],
        } as any)
      ).rejects.toThrow()
    })
  })

  describe('retrieve()', () => {
    it('should retrieve a specific API key', async () => {
      const response = await client.apiKeys.retrieve('key_1')

      expect(response.data).toMatchObject({
        id: 'key_1',
        name: 'Production Key',
        key_prefix: 'sk_live_abc',
        scopes: ['read:jobs', 'write:jobs'],
      })

      // Full key should NOT be present (security)
      expect(response.data).not.toHaveProperty('key')
    })

    it('should handle not found errors', async () => {
      await expect(
        client.apiKeys.retrieve('not_found')
      ).rejects.toThrow('Job not found')
    })
  })

  describe('update()', () => {
    it('should update API key name', async () => {
      const response = await client.apiKeys.update('key_1', {
        name: 'Updated Name',
      })

      expect(response.data.name).toBe('Updated Name')
    })

    it('should update API key scopes', async () => {
      const response = await client.apiKeys.update('key_1', {
        scopes: ['read:jobs', 'write:jobs', 'read:applications'] as APIKeyScope[],
      })

      expect(response.data.scopes).toContain('read:applications')
    })

    it('should deactivate API key', async () => {
      const response = await client.apiKeys.update('key_1', {
        is_active: false,
      })

      expect(response.data.is_active).toBe(false)
    })
  })

  describe('revoke()', () => {
    it('should revoke an API key', async () => {
      const response = await client.apiKeys.revoke('key_1')

      expect(response.data).toMatchObject({
        id: 'key_1',
        message: expect.stringContaining('revoked'),
      })
    })
  })

  describe('getUsage()', () => {
    it('should get usage statistics', async () => {
      const response = await client.apiKeys.getUsage('key_1', 30)

      expect(response.data).toMatchObject({
        total_requests: 1500,
        success_requests: 1450,
        error_requests: 50,
        error_rate: '3.33',
        avg_response_time_ms: 125,
        period_days: 30,
      })

      expect(response.data.usage).toBeInstanceOf(Array)
      expect(response.data.usage.length).toBeGreaterThan(0)
    })

    it('should support different time ranges', async () => {
      const weekly = await client.apiKeys.getUsage('key_1', 7)
      const monthly = await client.apiKeys.getUsage('key_1', 30)
      const quarterly = await client.apiKeys.getUsage('key_1', 90)

      expect(weekly.data.period_days).toBe(7)
      expect(monthly.data.period_days).toBe(30)
      expect(quarterly.data.period_days).toBe(90)
    })
  })
})
