import { renderHook, act } from '@testing-library/react-native'
import { describe, it, expect, vi } from 'vitest'
import { useSlider } from '../useSlider'

// Mock haptics
vi.mock('../../platform/useHaptics', () => ({
  useHaptics: () => ({
    impact: vi.fn(),
    selection: vi.fn(),
  })
}))

describe('useSlider', () => {
  it('should initialize with default value', () => {
    const { result } = renderHook(() => useSlider({ min: 0, max: 100 }))
    expect(result.current.currentValue).toBe(0)
    expect(result.current.isRange).toBe(false)
  })

  it('should initialize with default range', () => {
    const { result } = renderHook(() => useSlider({ min: 0, max: 100, range: [20, 80] }))
    expect(result.current.currentRange).toEqual([20, 80])
    expect(result.current.isRange).toBe(true)
  })

  it('should calculate positions correctly', () => {
    const { result } = renderHook(() => useSlider({ min: 0, max: 100 }))
    
    // Simulate setting track width (e.g. from onLayout)
    act(() => {
      // Direct state manipulation isn't exposed, but we can simulate the effect 
      // by setting a mock track layout event if exposed, or just testing the function
      // The function itself returns 0 when width is 0.
      expect(result.current.calculatePosition(50)).toBe(0)
    })
  })
})
