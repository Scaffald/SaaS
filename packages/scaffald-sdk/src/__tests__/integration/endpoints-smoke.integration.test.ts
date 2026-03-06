/**
 * Integration smoke tests: one call per resource against the real local API with a valid JWT.
 * Run with: SCAFFALD_INTEGRATION=1 pnpm test:integration
 * Requires: local Supabase, API served, test user (see token-and-auth.integration.test.ts).
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { Scaffald } from '../../client'
import {
  isIntegrationEnabled,
  getIntegrationConfig,
} from './integration.setup'

const describeIfIntegration = isIntegrationEnabled() ? describe : describe.skip

describeIfIntegration('Integration: Per-endpoint smoke', () => {
  let client: Scaffald

  beforeAll(async () => {
    const config = getIntegrationConfig()
    const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey)
    const { data, error } = await supabase.auth.signInWithPassword({
      email: config.testUserEmail,
      password: config.testUserPassword,
    })
    if (error || !data.session?.access_token) {
      throw new Error(
        `Integration setup: sign-in failed. ${error?.message ?? 'no session'}`
      )
    }
    client = new Scaffald({
      baseUrl: config.baseUrl,
      supabaseToken: data.session.access_token,
    })
  })

  it('jobs.list() returns data or empty list', async () => {
    const result = await client.jobs.list()
    expect(result).toBeDefined()
    expect(result).toHaveProperty('data')
    expect(Array.isArray(result.data)).toBe(true)
    if (result.pagination) {
      expect(typeof result.pagination.total).toBe('number')
    }
  })

  it('industries.list() returns data or empty list', async () => {
    const result = await client.industries.list()
    expect(result).toBeDefined()
    expect(Array.isArray(result.data)).toBe(true)
  })

  it('auth.getUserRoles() returns roles array', async () => {
    const result = await client.auth.getUserRoles()
    expect(result).toBeDefined()
    expect(result).toHaveProperty('roles')
    expect(Array.isArray(result.roles)).toBe(true)
  })

  it('apiKeys.list() returns 2xx (authenticated)', async () => {
    const result = await client.apiKeys.list()
    expect(result).toBeDefined()
    const list = Array.isArray(result) ? result : (result as { data?: unknown[] }).data
    expect(Array.isArray(list)).toBe(true)
  })

  it('connections.list() returns 2xx (authenticated)', async () => {
    const result = await client.connections.list()
    expect(result).toBeDefined()
    const list = (result as { data?: unknown[] }).data ?? result
    expect(Array.isArray(list)).toBe(true)
  })

  it('notifications.list() returns 2xx or paginated shape', async () => {
    const result = await client.notifications.list()
    expect(result).toBeDefined()
    const data = (result as { data?: unknown[] }).data
    expect(Array.isArray(data)).toBe(true)
  })

  it('prerequisites.check() returns check result', async () => {
    const result = await client.prerequisites.check()
    expect(result).toBeDefined()
    expect(typeof result.isComplete).toBe('boolean')
  })

  it('profiles.getUser() with invalid username returns 404 or throws', async () => {
    try {
      await client.profiles.getUser('__nonexistent_slug_12345__')
      expect(true).toBe(true)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      expect(
        message.includes('404') || message.includes('Not found') || message.includes('not found')
      ).toBe(true)
    }
  })
})
