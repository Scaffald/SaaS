import { renderHook, act } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockPlatform = { OS: 'web' as 'web' | 'ios' | 'android' | 'macos' | 'windows' }

vi.mock('react-native', () => ({
  Platform: mockPlatform,
}))

const { useScrollToCard } = await import('../useScrollToCard')

describe('useScrollToCard', () => {
  beforeEach(() => {
    mockPlatform.OS = 'web'
  })

  it('registers card refs and scrolls into view on web', () => {
    const { result } = renderHook(() => useScrollToCard())

    const scrollIntoView = vi.fn()
    const cardElement = { scrollIntoView } as unknown as HTMLElement

    act(() => {
      result.current.scrollViewRef.current = {}
      result.current.registerCardRef('profile-1', cardElement)
      result.current.scrollToCard('profile-1')
    })

    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest',
    })
  })

  it('invokes native measurement callbacks when running on native platforms', () => {
    mockPlatform.OS = 'ios'

    const { result } = renderHook(() => useScrollToCard())

    const scrollTo = vi.fn()
    const measureLayout = vi.fn(
      (
        _container: unknown,
        onSuccess: (x: number, y: number, width: number, height: number) => void,
        _onFail?: () => void,
      ) => {
        onSuccess(0, 240, 0, 0)
      },
    )

    act(() => {
      result.current.scrollViewRef.current = { scrollTo }
      result.current.registerCardRef('profile-2', { measureLayout } as unknown)
      result.current.scrollToCard('profile-2')
    })

    expect(measureLayout).toHaveBeenCalled()
    expect(scrollTo).toHaveBeenCalledWith({
      y: 140,
      animated: true,
    })
  })

  it('no-ops when card ref or scroll view ref is unavailable', () => {
    const { result } = renderHook(() => useScrollToCard())
    const scrollIntoView = vi.fn()

    act(() => {
      result.current.registerCardRef('missing', { scrollIntoView } as unknown as HTMLElement)
      result.current.scrollToCard('missing')
    })

    expect(scrollIntoView).not.toHaveBeenCalled()
  })
})


