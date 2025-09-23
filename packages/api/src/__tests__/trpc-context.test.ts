import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@supabase/auth-helpers-nextjs', () => ({
  createRouteHandlerClient: vi.fn(),
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}))

vi.mock('jose', () => ({
  jwtVerify: vi.fn(),
}))

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'

type MockedSupabase = {
  auth: {
    getUser: ReturnType<typeof vi.fn>
  }
}

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
  process.env.SUPABASE_AUTH_JWT_SECRET = 'jwt-secret'
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key'
}

const createRequestOptions = (headersInit?: HeadersInit) => {
  const request = new Request('https://api.example.com', { headers: headersInit })
  const responseHeaders = new Headers()
  return { req: request, resHeaders: responseHeaders, info: {} as any }
}

const loadCreateTRPCContext = async () => {
  const module = await import('../trpc')
  return module.createTRPCContext
}

const createSupabaseWithUser = (userId: string | null): MockedSupabase => ({
  auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user: userId ? { id: userId } : null } }),
  },
})

beforeEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
  setRequiredEnv()
  vi.mocked(cookies).mockResolvedValue(new Map() as never)
})

afterEach(() => {
  resetEnvironment()
})

describe('createTRPCContext', () => {
  it('throws when the SUPABASE_AUTH_JWT_SECRET env variable is missing', async () => {
    delete process.env.SUPABASE_AUTH_JWT_SECRET

    const supabase = createSupabaseWithUser('user-from-cookie')
    vi.mocked(createRouteHandlerClient).mockReturnValue(supabase as never)

    const createTRPCContext = await loadCreateTRPCContext()

    await expect(createTRPCContext(createRequestOptions())).rejects.toThrow(
      'the `SUPABASE_AUTH_JWT_SECRET` env variable is not set.'
    )
  })

  it('throws when the NEXT_PUBLIC_SUPABASE_URL env variable is missing', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL

    const supabase = createSupabaseWithUser('user-from-cookie')
    vi.mocked(createRouteHandlerClient).mockReturnValue(supabase as never)

    const createTRPCContext = await loadCreateTRPCContext()

    await expect(createTRPCContext(createRequestOptions())).rejects.toThrow(
      'the `NEXT_PUBLIC_SUPABASE_URL` env variable is not set.'
    )
  })

  it('throws when the NEXT_PUBLIC_SUPABASE_ANON_KEY env variable is missing', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    const supabase = createSupabaseWithUser('user-from-cookie')
    vi.mocked(createRouteHandlerClient).mockReturnValue(supabase as never)

    const createTRPCContext = await loadCreateTRPCContext()

    await expect(createTRPCContext(createRequestOptions())).rejects.toThrow(
      'the `NEXT_PUBLIC_SUPABASE_ANON_KEY` env variable is not set.'
    )
  })

  it('returns the session user from cookies when no authorization header is present', async () => {
    const supabase = createSupabaseWithUser('cookie-user')
    vi.mocked(createRouteHandlerClient).mockReturnValue(supabase as never)

    const createTRPCContext = await loadCreateTRPCContext()

    const context = await createTRPCContext(createRequestOptions({ Origin: 'https://client.app' }))

    expect(context.user).toEqual({ id: 'cookie-user' })
    expect(context.requestOrigin).toBe('https://client.app')
    expect(context.supabase).toBe(supabase)
    expect(createClient).not.toHaveBeenCalled()
    expect(jwtVerify).not.toHaveBeenCalled()
  })

  it('uses bearer tokens when provided in the authorization header', async () => {
    const routeSupabase = createSupabaseWithUser(null)
    const authorizedSupabase = { from: vi.fn() }

    vi.mocked(createRouteHandlerClient).mockReturnValue(routeSupabase as never)
    vi.mocked(createClient).mockReturnValue(authorizedSupabase as never)
    vi.mocked(jwtVerify).mockResolvedValue({ payload: { sub: 'bearer-user' } } as never)

    const createTRPCContext = await loadCreateTRPCContext()

    const context = await createTRPCContext(
      createRequestOptions({
        Authorization: 'Bearer access-token',
        Origin: 'https://mobile.app',
      })
    )

    expect(jwtVerify).toHaveBeenCalledWith('access-token', expect.any(Uint8Array))
    expect(createClient).toHaveBeenCalledWith(
      'https://example.supabase.co',
      'anon-key',
      expect.objectContaining({
        global: { headers: { Authorization: 'Bearer access-token' } },
      })
    )
    expect(context.user).toEqual({ id: 'bearer-user' })
    expect(context.supabase).toBe(authorizedSupabase)
    expect(context.requestOrigin).toBe('https://mobile.app')
  })

  it('logs parsing errors and leaves the user unauthenticated when the bearer token is invalid', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const routeSupabase = createSupabaseWithUser(null)
    const authorizedSupabase = { from: vi.fn() }

    vi.mocked(createRouteHandlerClient).mockReturnValue(routeSupabase as never)
    vi.mocked(createClient).mockReturnValue(authorizedSupabase as never)
    vi.mocked(jwtVerify).mockRejectedValue(new Error('invalid token'))

    const createTRPCContext = await loadCreateTRPCContext()

    const context = await createTRPCContext(
      createRequestOptions({ Authorization: 'Bearer invalid-token' })
    )

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error parsing JWT', 'invalid token')
    expect(context.user).toBeUndefined()
    expect(context.supabase).toBe(authorizedSupabase)

    consoleErrorSpy.mockRestore()
  })
})
