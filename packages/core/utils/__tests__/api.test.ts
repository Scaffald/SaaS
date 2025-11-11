import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  createClientMock,
  httpBatchLinkMock,
  clearAllAuthStorageMock,
  getGlobalQueryClientMock,
  supabaseSessionMock,
} = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  httpBatchLinkMock: vi.fn((options: unknown) => ({ type: 'http', options })),
  clearAllAuthStorageMock: vi.fn(),
  getGlobalQueryClientMock: vi.fn(),
  supabaseSessionMock: vi.fn(),
}))

vi.mock('@trpc/react-query', () => ({
  createTRPCReact: vi.fn(() => ({
    createClient: createClientMock,
  })),
}))

class MockTRPCClientError extends Error {
  data?: { code?: string }

  constructor(message: string, options?: { data?: { code?: string } }) {
    super(message)
    this.data = options?.data
  }
}

vi.mock('@trpc/client', () => ({
  httpBatchLink: httpBatchLinkMock,
  TRPCClientError: MockTRPCClientError,
}))

vi.mock('../supabase/client', () => ({
  supabase: {
    auth: {
      getSession: supabaseSessionMock,
    },
  },
}))

vi.mock('../auth/clearAuthStorage', () => ({
  clearAllAuthStorage: clearAllAuthStorageMock,
}))

vi.mock('@app/core/provider/react-query/queryClient', () => ({
  getGlobalQueryClient: getGlobalQueryClientMock,
}))

vi.mock('../sentry/client', () => ({
  Sentry: {},
}))

describe('createTrpcClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://supabase.test'
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'anon-key'
    supabaseSessionMock.mockResolvedValue({
      data: { session: { access_token: 'access-token' } },
    })
    createClientMock.mockReturnValue({ client: true })
  })

  it('creates a TRPC client with performance, session, and HTTP links', async () => {
    const { createTrpcClient } = await import('../api')
    const client = createTrpcClient()

    expect(client).toEqual({ client: true })
    expect(createClientMock).toHaveBeenCalledTimes(1)

    const config = createClientMock.mock.calls[0]?.[0]
    expect(Array.isArray(config.links)).toBe(true)
    expect(config.links).toHaveLength(3)

    const batchLinkOptions = httpBatchLinkMock.mock.calls.at(-1)?.[0] as {
      url: string
      headers: () => Promise<Record<string, string>>
    }
    expect(batchLinkOptions.url).toBe('https://supabase.test/functions/v1/trpc')

    const headers = await batchLinkOptions.headers()
    expect(headers).toMatchObject({
      apikey: 'anon-key',
      Authorization: 'Bearer access-token',
      'x-trpc-source': 'expo-web',
    })
  })

  it('uses the anon key when no access token is available', async () => {
    supabaseSessionMock.mockResolvedValue({
      data: { session: null },
    })

    const { createTrpcClient } = await import('../api')
    createTrpcClient()

    const batchLinkOptions = httpBatchLinkMock.mock.calls.at(-1)?.[0] as {
      headers: () => Promise<Record<string, string>>
    }
    const headers = await batchLinkOptions.headers()
    expect(headers.Authorization).toBe('Bearer anon-key')
  })

  it('does not clear auth storage for non-UNAUTHORIZED errors', async () => {
    const { createTrpcClient } = await import('../api')
    createTrpcClient()

    const links = createClientMock.mock.calls.at(-1)?.[0]?.links ?? []
    const [, sessionLink] = links
    const next = vi.fn().mockReturnValue({
      subscribe: (handlers: { error: (err: unknown) => void }) => {
        handlers.error(new Error('boom'))
        return () => {}
      },
    })

    sessionLink({ next, op: { path: 'test.path', type: 'query', context: {} } })

    expect(clearAllAuthStorageMock).not.toHaveBeenCalled()
  })
})


