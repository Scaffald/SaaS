import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useAdaptiveLoading } from '../useAdaptiveLoading'

describe('useAdaptiveLoading', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows loading immediately when delay is zero or negative', () => {
    const { result, rerender } = renderHook(({ loading, delay }) =>
      useAdaptiveLoading(loading, delay),
    {
      initialProps: { loading: false, delay: 0 },
    })

    expect(result.current).toBe(false)

    rerender({ loading: true, delay: 0 })
    expect(result.current).toBe(true)

    rerender({ loading: true, delay: -10 })
    expect(result.current).toBe(true)
  })

  it('delays surfacing the loading state', () => {
    const { result, rerender } = renderHook(({ loading }) => useAdaptiveLoading(loading, 200), {
      initialProps: { loading: false },
    })

    expect(result.current).toBe(false)

    rerender({ loading: true })
    expect(result.current).toBe(false)

    act(() => {
      vi.advanceTimersByTime(199)
    })
    expect(result.current).toBe(false)

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(result.current).toBe(true)
  })

  it('resets loading state when source loading flag becomes false', () => {
    const { result, rerender } = renderHook(({ loading }) => useAdaptiveLoading(loading, 100), {
      initialProps: { loading: true },
    })

    act(() => {
      vi.advanceTimersByTime(100)
    })
    expect(result.current).toBe(true)

    rerender({ loading: false })
    expect(result.current).toBe(false)
  })
})


