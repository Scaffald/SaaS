/**
 * useControlledState hook tests
 */

import { renderHook, act } from '@testing-library/react-native'
import { describe, it, expect, vi } from 'vitest'
import { useControlledState } from '../useControlledState'

describe('useControlledState', () => {
  describe('Uncontrolled mode', () => {
    it('should use default value when controlledValue is undefined', () => {
      const { result } = renderHook(() => useControlledState(undefined, 'default'))

      expect(result.current[0]).toBe('default')
    })

    it('should update internal state when setValue is called', () => {
      const { result } = renderHook(() => useControlledState(undefined, 'initial'))

      act(() => {
        result.current[1]('updated')
      })

      expect(result.current[0]).toBe('updated')
    })

    it('should call onChange with new value', () => {
      const onChange = vi.fn()
      const { result } = renderHook(() => useControlledState(undefined, 'initial', onChange))

      act(() => {
        result.current[1]('new value')
      })

      expect(onChange).toHaveBeenCalledWith('new value')
      expect(onChange).toHaveBeenCalledTimes(1)
    })

    it('should handle boolean values', () => {
      const { result } = renderHook(() => useControlledState(undefined, false))

      expect(result.current[0]).toBe(false)

      act(() => {
        result.current[1](true)
      })

      expect(result.current[0]).toBe(true)
    })

    it('should handle number values', () => {
      const { result } = renderHook(() => useControlledState(undefined, 0))

      expect(result.current[0]).toBe(0)

      act(() => {
        result.current[1](42)
      })

      expect(result.current[0]).toBe(42)
    })

    it('should handle object values', () => {
      const defaultObj = { count: 0 }
      const { result } = renderHook(() => useControlledState(undefined, defaultObj))

      expect(result.current[0]).toEqual({ count: 0 })

      act(() => {
        result.current[1]({ count: 10 })
      })

      expect(result.current[0]).toEqual({ count: 10 })
    })
  })

  describe('Controlled mode', () => {
    it('should use controlled value when provided', () => {
      const { result } = renderHook(() => useControlledState('controlled', 'default'))

      expect(result.current[0]).toBe('controlled')
    })

    it('should not update internal state when setValue is called', () => {
      const { result } = renderHook(() => useControlledState('controlled', 'default'))

      act(() => {
        result.current[1]('should not update')
      })

      // Should still be the controlled value
      expect(result.current[0]).toBe('controlled')
    })

    it('should call onChange with new value', () => {
      const onChange = vi.fn()
      const { result } = renderHook(() => useControlledState('controlled', 'default', onChange))

      act(() => {
        result.current[1]('new value')
      })

      expect(onChange).toHaveBeenCalledWith('new value')
      expect(onChange).toHaveBeenCalledTimes(1)
    })

    it('should update when controlled value changes', () => {
      const { result, rerender } = renderHook(
        ({ controlledValue }) => useControlledState(controlledValue, 'default'),
        {
          initialProps: { controlledValue: 'value1' },
        },
      )

      expect(result.current[0]).toBe('value1')

      rerender({ controlledValue: 'value2' })

      expect(result.current[0]).toBe('value2')
    })

    it('should handle boolean controlled values', () => {
      const { result, rerender } = renderHook(
        ({ checked }) => useControlledState(checked, false),
        {
          initialProps: { checked: true },
        },
      )

      expect(result.current[0]).toBe(true)

      rerender({ checked: false })

      expect(result.current[0]).toBe(false)
    })
  })

  describe('Mode switching', () => {
    it('should switch from uncontrolled to controlled', () => {
      const { result, rerender } = renderHook(
        ({ controlledValue }) => useControlledState(controlledValue, 'default'),
        {
          initialProps: { controlledValue: undefined },
        },
      )

      // Start uncontrolled
      expect(result.current[0]).toBe('default')

      act(() => {
        result.current[1]('internal value')
      })

      expect(result.current[0]).toBe('internal value')

      // Switch to controlled
      rerender({ controlledValue: 'now controlled' })

      expect(result.current[0]).toBe('now controlled')
    })

    it('should switch from controlled to uncontrolled', () => {
      const { result, rerender } = renderHook(
        ({ controlledValue }) => useControlledState(controlledValue, 'default'),
        {
          initialProps: { controlledValue: 'controlled' as string | undefined },
        },
      )

      // Start controlled
      expect(result.current[0]).toBe('controlled')

      // Switch to uncontrolled
      rerender({ controlledValue: undefined })

      // Should use last internal state (which is still default)
      expect(result.current[0]).toBe('default')

      // Now updates should work
      act(() => {
        result.current[1]('new internal value')
      })

      expect(result.current[0]).toBe('new internal value')
    })
  })

  describe('Edge cases', () => {
    it('should handle undefined onChange', () => {
      const { result } = renderHook(() => useControlledState(undefined, 'default'))

      // Should not throw
      expect(() => {
        act(() => {
          result.current[1]('new value')
        })
      }).not.toThrow()

      expect(result.current[0]).toBe('new value')
    })

    it('should handle null values in controlled mode', () => {
      const onChange = vi.fn()
      const { result } = renderHook(() => useControlledState<string | null>(null, null, onChange))

      // In controlled mode with null
      expect(result.current[0]).toBe(null)

      act(() => {
        result.current[1]('not null anymore')
      })

      // Value stays null because it's controlled (parent must update it)
      expect(result.current[0]).toBe(null)
      // But onChange is called
      expect(onChange).toHaveBeenCalledWith('not null anymore')
    })

    it('should handle null as default value in uncontrolled mode', () => {
      const { result } = renderHook(() => useControlledState<string | null>(undefined, null))

      expect(result.current[0]).toBe(null)

      act(() => {
        result.current[1]('not null anymore')
      })

      expect(result.current[0]).toBe('not null anymore')
    })

    it('should handle empty string values', () => {
      const { result } = renderHook(() => useControlledState(undefined, ''))

      expect(result.current[0]).toBe('')

      act(() => {
        result.current[1]('now has value')
      })

      expect(result.current[0]).toBe('now has value')
    })

    it('should memoize setValue function', () => {
      const onChange = vi.fn()
      const { result, rerender } = renderHook(() => useControlledState(undefined, 'default', onChange))

      const firstSetValue = result.current[1]

      rerender()

      const secondSetValue = result.current[1]

      // setValue should be the same reference
      expect(firstSetValue).toBe(secondSetValue)
    })
  })

  describe('Real-world scenarios', () => {
    it('should work like a checkbox controlled/uncontrolled pattern', () => {
      const onChange = vi.fn()
      const { result, rerender } = renderHook(
        ({ checked }) => useControlledState(checked, false, onChange),
        {
          initialProps: { checked: undefined as boolean | undefined },
        },
      )

      // Uncontrolled checkbox
      expect(result.current[0]).toBe(false)

      act(() => {
        result.current[1](true)
      })

      expect(result.current[0]).toBe(true)
      expect(onChange).toHaveBeenCalledWith(true)

      // Make it controlled
      rerender({ checked: false })

      expect(result.current[0]).toBe(false)

      act(() => {
        result.current[1](true)
      })

      // State doesn't change (controlled), but onChange is called
      expect(result.current[0]).toBe(false)
      expect(onChange).toHaveBeenCalledWith(true)
      expect(onChange).toHaveBeenCalledTimes(2)
    })

    it('should work like an input controlled/uncontrolled pattern', () => {
      const onChange = vi.fn()
      const { result } = renderHook(() => useControlledState(undefined, '', onChange))

      // Uncontrolled input
      expect(result.current[0]).toBe('')

      act(() => {
        result.current[1]('t')
      })
      expect(result.current[0]).toBe('t')

      act(() => {
        result.current[1]('te')
      })
      expect(result.current[0]).toBe('te')

      act(() => {
        result.current[1]('test')
      })
      expect(result.current[0]).toBe('test')

      expect(onChange).toHaveBeenCalledTimes(3)
    })
  })
})
