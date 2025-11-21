import type React from 'react'
import { renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest'

function createMockChannel(name: string) {
  const callbacks: Array<() => void> = []
  const unsubscribe = vi.fn()

  const channel = {
    name,
    on: (_event: string, _filter: unknown, handler: () => void) => {
      callbacks.push(handler)
      return channel
    },
    subscribe: () => channel,
    unsubscribe,
    trigger: () => {
      callbacks.forEach((callback) => {
        callback()
      })
    },
  }

  channelMocks.push(channel)
  return channel
}

const channelMocks: Array<ReturnType<typeof createMockChannel>> = []

const supabaseMock = {
  channel: vi.fn((name: string) => createMockChannel(name)),
}

vi.mock('../client', () => ({
  supabase: supabaseMock,
}))

describe('useInquirySubscription', () => {
  const queryClient = new QueryClient()
  const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries') as Mock

  beforeEach(() => {
    channelMocks.length = 0
    supabaseMock.channel.mockClear()
    invalidateSpy.mockClear()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  it('subscribes to inquiry-related channels and invalidates cache on changes', async () => {
    const { useInquirySubscription } = await import('../useInquirySubscription')

    const { unmount } = renderHook(() => useInquirySubscription('inquiry-123'), {
      wrapper,
    })

    expect(supabaseMock.channel).toHaveBeenCalledTimes(4)
    expect(supabaseMock.channel).toHaveBeenCalledWith('inquiry-inquiry-123')
    expect(supabaseMock.channel).toHaveBeenCalledWith('inquiry-comments-inquiry-123')
    expect(supabaseMock.channel).toHaveBeenCalledWith('inquiry-sections-inquiry-123')
    expect(supabaseMock.channel).toHaveBeenCalledWith('inquiry-capability-inquiry-123')

    channelMocks.forEach((channel) => {
      channel.trigger()
    })

    expect(invalidateSpy).toHaveBeenCalledTimes(4)

    unmount()
    channelMocks.forEach((channel) => {
      expect(channel.unsubscribe).toHaveBeenCalled()
    })
  })

  it('does nothing when inquiry id is null', async () => {
    const { useInquirySubscription } = await import('../useInquirySubscription')

    renderHook(() => useInquirySubscription(null), { wrapper })

    expect(supabaseMock.channel).not.toHaveBeenCalled()
    expect(invalidateSpy).not.toHaveBeenCalled()
  })
})
