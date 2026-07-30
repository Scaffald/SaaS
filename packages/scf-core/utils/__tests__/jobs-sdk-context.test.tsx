import type React from 'react'
import { render, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const useSessionContextMock = vi.fn()

vi.mock('../supabase/useSessionContext', () => ({
  useSessionContext: useSessionContextMock,
}))

vi.mock('@scaffald/sdk/react', () => ({
  ScaffaldProvider: ({ children }: { children: React.ReactNode }) => children,
  useScaffaldOrNull: () => null,
}))

vi.mock('expo-constants', () => ({
  default: { expoConfig: { extra: {} } },
}))

describe('ScaffaldJobsSdkProviderFromSession', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient()
    useSessionContextMock.mockReset()
  })

  const renderProvider = async () => {
    const { ScaffaldJobsSdkProviderFromSession } = await import('../jobs-sdk-context')
    // Build a fresh element each call (not a reused reference) — React bails
    // out of re-rendering a root given the exact same element instance.
    const makeTree = () => (
      <QueryClientProvider client={queryClient}>
        <ScaffaldJobsSdkProviderFromSession>
          <></>
        </ScaffaldJobsSdkProviderFromSession>
      </QueryClientProvider>
    )
    return { ...render(makeTree()), makeTree }
  }

  // Regression test for #382: the badge (useUnreadCount, gated on `!!session`)
  // showed unread notifications while the drawer panel (useNotifications, not
  // gated) stayed on "You're all caught up" — because notifications queries
  // fetched with dummy/anon auth during the session-loading window were never
  // refetched once the real session became available. Root cause: 'notifications'
  // hooks key their queries as ['scaffald', 'notifications', ...], but the
  // session-ready invalidation predicate only checked bare first-segment keys.
  it('invalidates notifications queries once the session finishes loading', async () => {
    useSessionContextMock.mockReturnValue({ session: null, isLoading: true })

    queryClient.setQueryData(['scaffald', 'notifications', 'list', { limit: 8 }], { data: [] })
    queryClient.setQueryData(['scaffald', 'notifications', 'unread-count'], { data: { unread_count: 0 } })
    queryClient.setQueryData(['scaffald', 'apiKeys', 'list'], { data: [] })
    queryClient.setQueryData(['profiles', 'general'], { data: {} })
    queryClient.setQueryData(['unrelated', 'thing'], { data: {} })

    const { rerender, makeTree } = await renderProvider()

    // Still loading — nothing invalidated yet.
    expect(
      queryClient.getQueryState(['scaffald', 'notifications', 'list', { limit: 8 }])?.isInvalidated
    ).toBe(false)

    useSessionContextMock.mockReturnValue({
      session: { access_token: 'real-token' },
      isLoading: false,
    })

    await act(async () => {
      rerender(makeTree())
    })

    expect(
      queryClient.getQueryState(['scaffald', 'notifications', 'list', { limit: 8 }])?.isInvalidated
    ).toBe(true)
    expect(
      queryClient.getQueryState(['scaffald', 'notifications', 'unread-count'])?.isInvalidated
    ).toBe(true)
    expect(queryClient.getQueryState(['scaffald', 'apiKeys', 'list'])?.isInvalidated).toBe(true)
    expect(queryClient.getQueryState(['profiles', 'general'])?.isInvalidated).toBe(true)
    expect(queryClient.getQueryState(['unrelated', 'thing'])?.isInvalidated).toBe(false)
  })
})
