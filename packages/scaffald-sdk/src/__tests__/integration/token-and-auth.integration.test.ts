/**
 * Integration tests: real token issuance and token validity against local API.
 * Run with: SCAFFALD_INTEGRATION=1 pnpm test:integration
 * Requires: local Supabase (pnpm supa start), API served (e.g. pnpm supa functions serve api), test user test@example.com / test123456
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { Scaffald } from '../../client'
import {
  isIntegrationEnabled,
  getIntegrationConfig,
} from './integration.setup'

const describeIfIntegration = isIntegrationEnabled() ? describe : describe.skip

describeIfIntegration('Integration: Token issuance and validity', () => {
  let accessToken: string
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
        `Integration test setup: sign-in failed. Create user ${config.testUserEmail} with password ${config.testUserPassword}. Error: ${error?.message ?? 'no session'}`
      )
    }
    accessToken = data.session.access_token
    client = new Scaffald({
      baseUrl: config.baseUrl,
      supabaseToken: accessToken,
    })
  })

  it('obtains a non-empty access_token via signInWithPassword', () => {
    expect(accessToken).toBeDefined()
    expect(typeof accessToken).toBe('string')
    expect(accessToken.length).toBeGreaterThan(50)
    expect(accessToken.startsWith('eyJ')).toBe(true)
  })

  it('validates token via GET /v1/auth/roles', async () => {
    const result = await client.auth.getUserRoles()
    expect(result).toBeDefined()
    expect(result).toHaveProperty('roles')
    expect(Array.isArray(result.roles)).toBe(true)
  })
})
