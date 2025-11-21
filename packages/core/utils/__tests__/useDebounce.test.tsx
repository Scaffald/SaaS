import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useDebounce } from '../useDebounce'

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns the initial value immediately', () => {
    const { result } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'initial', delay: 200 },
    })

    expect(result.current).toBe('initial')
  })

  it('updates to the latest value after the delay', () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'first', delay: 300 },
    })

    expect(result.current).toBe('first')

    rerender({ value: 'second', delay: 300 })
    expect(result.current).toBe('first')

    act(() => {
      vi.advanceTimersByTime(299)
    })
    expect(result.current).toBe('first')

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(result.current).toBe('second')
  })

  it('clears pending timeout when unmounted', () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')
    const { rerender, unmount } = renderHook(({ value }) => useDebounce(value, 500), {
      initialProps: { value: 'first' },
    })

    rerender({ value: 'second' })
    unmount()

    expect(clearTimeoutSpy).toHaveBeenCalled()
  })
})
