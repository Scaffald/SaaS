import type { ReactNode } from 'react'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { Database } from '@app/supabase/types'
import { createSupabaseClientStub } from '@app/test-utils'

vi.mock('../../supabase/useSupabase', () => ({
  useSupabase: vi.fn(),
}))

vi.mock('../../useUser', () => ({
  useUser: vi.fn(),
}))

import { useSupabase } from '../../supabase/useSupabase'
import { useUser } from '../../useUser'
import useEventsQuery from '../useEventQuery'

type WrapperProps = {
  children: ReactNode
}

type RenderOptions = {
  events?: Array<{ id: string; created_at: string }>
  error?: { code?: string; status?: number; message?: string }
  retryAttempts?: number | false
}

const createQueryClient = (retry: number | false = false) =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry,
      },
    },
  })

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  cleanup()
})

const renderUseEventsQuery = (options: RenderOptions = {}) => {
  const { events = [], error = null } = options

  const selectMock = vi.fn().mockReturnThis()
  const eqMock = vi.fn().mockReturnThis()
  const orderMock = vi.fn().mockReturnThis()
  const limitMock = vi.fn().mockReturnValue(
    Promise.resolve({
      data: events,
      error,
    })
  )

  const fromMock = vi.fn((table: string) => {
    if (table !== 'events') {
      throw new Error(`Unexpected table: ${table}`)
    }

    return {
      select: selectMock,
      eq: eqMock,
      order: orderMock,
      limit: limitMock,
    }
  })

  const { client: supabase } = createSupabaseClientStub<Database>({
    from: fromMock,
  })

  vi.mocked(useSupabase).mockReturnValue(supabase)
  vi.mocked(useUser).mockReturnValue({ user: { id: 'user-123' } })

  const queryClient = createQueryClient(options.retryAttempts)

  const wrapper = ({ children }: WrapperProps) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  const rendered = renderHook(() => useEventsQuery(), { wrapper })

  return {
    rendered,
    queryClient,
    fromMock,
    eqMock,
    limitMock,
  }
}

describe('useEventsQuery', () => {
  it('fetches the latest events for the current user', async () => {
    const events = [
      { id: 'event-1', created_at: '2024-02-01T00:00:00Z' },
      { id: 'event-2', created_at: '2024-01-15T00:00:00Z' },
    ]

    const { rendered, queryClient, fromMock, eqMock } = renderUseEventsQuery({ events })

    await waitFor(() => expect(rendered.result.current.isSuccess).toBe(true))

    expect(fromMock).toHaveBeenCalledWith('events')
    expect(eqMock).toHaveBeenCalledWith('profile_id', 'user-123')
    expect(rendered.result.current.data).toEqual(events)

    queryClient.clear()
  })

  it('resolves to an empty list without retrying when Supabase reports a 404', async () => {
    const { rendered, queryClient, limitMock } = renderUseEventsQuery({
      events: [],
      error: { code: 'PGRST404', message: 'not found', status: 404 },
      retryAttempts: 2,
    })

    await waitFor(() => expect(rendered.result.current.isSuccess).toBe(true))

    expect(rendered.result.current.data).toEqual([])
    expect(limitMock).toHaveBeenCalledTimes(1)

    queryClient.clear()
  })
})
