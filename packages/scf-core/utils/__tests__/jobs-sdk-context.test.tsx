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
    // Roots the old ten-entry allow-list did not cover — these are the queries
    // that stayed 401 for the life of a /profile/resume load (#579).
    queryClient.setQueryData(['profiles', 'employment'], { data: {} })
    queryClient.setQueryData(['resume', 'has-uploaded'], { data: {} })
    queryClient.setQueryData(['scaffald', 'skills', 'multi-taxonomy'], { data: {} })
    queryClient.setQueryData(['idVerification', 'current', 'u1'], { data: {} })
    queryClient.setQueryData(['user-profiles', 'detail', 'u1'], { data: {} })
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
    expect(queryClient.getQueryState(['profiles', 'employment'])?.isInvalidated).toBe(true)
    expect(queryClient.getQueryState(['resume', 'has-uploaded'])?.isInvalidated).toBe(true)
    expect(
      queryClient.getQueryState(['scaffald', 'skills', 'multi-taxonomy'])?.isInvalidated
    ).toBe(true)
    expect(queryClient.getQueryState(['idVerification', 'current', 'u1'])?.isInvalidated).toBe(true)
    expect(queryClient.getQueryState(['user-profiles', 'detail', 'u1'])?.isInvalidated).toBe(true)
    // Previously this asserted `false`, to prove the allow-list was selective.
    // The allow-list is gone: it covered 10 of 30+ roots and silently dropped
    // every hook added after it was written. Everything in the cache was fetched
    // with the credential that just changed, non-SDK queries included, so
    // everything is now invalidated. react-query only refetches what is mounted.
    expect(queryClient.getQueryState(['unrelated', 'thing'])?.isInvalidated).toBe(true)
  })

  // The half of #579 the isLoading-transition approach could not see: a token
  // that expires while the tab is open produces no true->false transition, so
  // nothing refetched and the screen stayed on whatever 401'd.
  it('invalidates again when the token is refreshed mid-session', async () => {
    useSessionContextMock.mockReturnValue({
      session: { access_token: 'first-token' },
      isLoading: false,
    })

    const { rerender, makeTree } = await renderProvider()

    queryClient.setQueryData(['profiles', 'general'], { data: {} })
    expect(queryClient.getQueryState(['profiles', 'general'])?.isInvalidated).toBe(false)

    useSessionContextMock.mockReturnValue({
      session: { access_token: 'refreshed-token' },
      isLoading: false,
    })
    await act(async () => {
      rerender(makeTree())
    })

    expect(queryClient.getQueryState(['profiles', 'general'])?.isInvalidated).toBe(true)
  })

  it('does not invalidate on a re-render that leaves the token unchanged', async () => {
    useSessionContextMock.mockReturnValue({
      session: { access_token: 'stable-token' },
      isLoading: false,
    })

    const { rerender, makeTree } = await renderProvider()

    queryClient.setQueryData(['profiles', 'general'], { data: {} })

    await act(async () => {
      rerender(makeTree())
    })

    expect(queryClient.getQueryState(['profiles', 'general'])?.isInvalidated).toBe(false)
  })
})
