import { vi, type MockInstance } from 'vitest'

export type FetchImplementation = (
  input: Parameters<typeof fetch>[0],
  init?: Parameters<typeof fetch>[1]
) => ReturnType<typeof fetch>

export type FetchMock = MockInstance<FetchImplementation>

export const createFetchMock = (
  implementation: FetchImplementation = async () => new Response(null, { status: 200 })
): FetchMock => vi.fn(implementation) as FetchMock

export type InstallFetchMockResult = {
  mock: FetchMock
  restore: () => void
}

export const installFetchMock = (implementation?: FetchImplementation): InstallFetchMockResult => {
  const target = globalThis as typeof globalThis & Record<PropertyKey, unknown>
  const hadFetch = 'fetch' in target
  const originalFetch = hadFetch ? (target.fetch as typeof fetch) : undefined
  const mock = createFetchMock(implementation)

  target.fetch = mock as unknown as typeof fetch

  return {
    mock,
    restore: () => {
      mock.mockReset()
      if (hadFetch) {
        target.fetch = originalFetch as typeof fetch
      } else {
        delete target.fetch
      }
    },
  }
}

export const mockJsonResponse = (body: unknown, init: ResponseInit = {}): Response => {
  const headers = new Headers(init.headers ?? {})
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  return new Response(JSON.stringify(body), {
    ...init,
    headers,
    status: init.status ?? 200,
  })
}
