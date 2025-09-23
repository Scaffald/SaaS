import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}))

import { createClient } from '@supabase/supabase-js'

const originalEnv = { ...process.env }

const resetEnvironment = () => {
  Object.keys(process.env).forEach((key) => {
    if (!(key in originalEnv)) {
      delete process.env[key]
    }
  })
  Object.assign(process.env, originalEnv)
}

const setRequiredEnv = () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
  process.env.SUPABASE_SERVICE_ROLE = 'service-role-key'
}

const importAdminModule = async () => {
  return import('../supabase-admin')
}

beforeEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
  setRequiredEnv()
})

afterEach(() => {
  resetEnvironment()
})

describe('supabaseAdmin', () => {
  it('creates the service role client when required environment variables are provided', async () => {
    const client = { auth: {} }
    vi.mocked(createClient).mockReturnValue(client as never)

    const module = await importAdminModule()

    expect(createClient).toHaveBeenCalledWith('https://example.supabase.co', 'service-role-key')
    expect(module.supabaseAdmin).toBe(client)
  })

  it('throws a helpful error when the Supabase URL is missing', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL

    await expect(importAdminModule()).rejects.toThrow(
      'NEXT_PUBLIC_SUPABASE_URL is not set. Please update the root .env.local and restart the server.'
    )
  })

  it('throws a helpful error when the service role key is missing', async () => {
    delete process.env.SUPABASE_SERVICE_ROLE

    await expect(importAdminModule()).rejects.toThrow(
      'SUPABASE_SERVICE_ROLE is not set. Please update the root .env.local and restart the server.'
    )
  })
})
