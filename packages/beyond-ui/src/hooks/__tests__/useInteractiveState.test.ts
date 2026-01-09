/**
 * useInteractiveState hook tests
 */

import { renderHook, act } from '@testing-library/react-native'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { Platform } from 'react-native'
import { useInteractiveState } from '../useInteractiveState'

describe('useInteractiveState', () => {
  const originalPlatform = Platform.OS

  afterEach(() => {
    // Restore original platform
    Object.defineProperty(Platform, 'OS', {
      value: originalPlatform,
      writable: true,
    })
  })

  describe('Web platform', () => {
    beforeEach(() => {
      Object.defineProperty(Platform, 'OS', {
        value: 'web',
        writable: true,
      })
    })

    it('should return initial state', () => {
      const { result } = renderHook(() => useInteractiveState(false))

      expect(result.current.isHovered).toBe(false)
      expect(result.current.isFocused).toBe(false)
      expect(result.current.interactiveProps).toBeDefined()
    })

    it('should provide event handlers in interactiveProps', () => {
      const { result } = renderHook(() => useInteractiveState(false))

      expect(result.current.interactiveProps.onMouseEnter).toBeDefined()
      expect(result.current.interactiveProps.onMouseLeave).toBeDefined()
      expect(result.current.interactiveProps.onFocus).toBeDefined()
      expect(result.current.interactiveProps.onBlur).toBeDefined()
    })

    it('should update isHovered on mouse enter', () => {
      const { result } = renderHook(() => useInteractiveState(false))

      act(() => {
        result.current.interactiveProps.onMouseEnter?.()
      })

      expect(result.current.isHovered).toBe(true)
      expect(result.current.isFocused).toBe(false)
    })

    it('should update isHovered on mouse leave', () => {
      const { result } = renderHook(() => useInteractiveState(false))

      act(() => {
        result.current.interactiveProps.onMouseEnter?.()
      })
      expect(result.current.isHovered).toBe(true)

      act(() => {
        result.current.interactiveProps.onMouseLeave?.()
      })

      expect(result.current.isHovered).toBe(false)
    })

    it('should update isFocused on focus', () => {
      const { result } = renderHook(() => useInteractiveState(false))

      act(() => {
        result.current.interactiveProps.onFocus?.()
      })

      expect(result.current.isFocused).toBe(true)
      expect(result.current.isHovered).toBe(false)
    })

    it('should update isFocused on blur', () => {
      const { result } = renderHook(() => useInteractiveState(false))

      act(() => {
        result.current.interactiveProps.onFocus?.()
      })
      expect(result.current.isFocused).toBe(true)

      act(() => {
        result.current.interactiveProps.onBlur?.()
      })

      expect(result.current.isFocused).toBe(false)
    })

    it('should handle both hover and focus states simultaneously', () => {
      const { result } = renderHook(() => useInteractiveState(false))

      act(() => {
        result.current.interactiveProps.onMouseEnter?.()
        result.current.interactiveProps.onFocus?.()
      })

      expect(result.current.isHovered).toBe(true)
      expect(result.current.isFocused).toBe(true)

      act(() => {
        result.current.interactiveProps.onMouseLeave?.()
      })

      expect(result.current.isHovered).toBe(false)
      expect(result.current.isFocused).toBe(true)

      act(() => {
        result.current.interactiveProps.onBlur?.()
      })

      expect(result.current.isHovered).toBe(false)
      expect(result.current.isFocused).toBe(false)
    })
  })

  describe('Native platforms (iOS/Android)', () => {
    beforeEach(() => {
      Object.defineProperty(Platform, 'OS', {
        value: 'ios',
        writable: true,
      })
    })

    it('should always return false for isHovered on native', () => {
      const { result } = renderHook(() => useInteractiveState(false))

      expect(result.current.isHovered).toBe(false)
    })

    it('should always return false for isFocused on native', () => {
      const { result } = renderHook(() => useInteractiveState(false))

      expect(result.current.isFocused).toBe(false)
    })

    it('should return empty interactiveProps on native', () => {
      const { result } = renderHook(() => useInteractiveState(false))

      expect(result.current.interactiveProps).toEqual({})
    })

    it('should work on Android as well', () => {
      Object.defineProperty(Platform, 'OS', {
        value: 'android',
        writable: true,
      })

      const { result } = renderHook(() => useInteractiveState(false))

      expect(result.current.isHovered).toBe(false)
      expect(result.current.isFocused).toBe(false)
      expect(result.current.interactiveProps).toEqual({})
    })
  })

  describe('Disabled state', () => {
    beforeEach(() => {
      Object.defineProperty(Platform, 'OS', {
        value: 'web',
        writable: true,
      })
    })

    it('should return empty interactiveProps when disabled', () => {
      const { result } = renderHook(() => useInteractiveState(true))

      expect(result.current.interactiveProps).toEqual({})
    })

    it('should not provide event handlers when disabled', () => {
      const { result } = renderHook(() => useInteractiveState(true))

      expect(result.current.interactiveProps.onMouseEnter).toBeUndefined()
      expect(result.current.interactiveProps.onMouseLeave).toBeUndefined()
      expect(result.current.interactiveProps.onFocus).toBeUndefined()
      expect(result.current.interactiveProps.onBlur).toBeUndefined()
    })

    it('should always return false for hover/focus when disabled', () => {
      const { result } = renderHook(() => useInteractiveState(true))

      expect(result.current.isHovered).toBe(false)
      expect(result.current.isFocused).toBe(false)
    })

    it('should update interactiveProps when disabled changes', () => {
      const { result, rerender } = renderHook(({ disabled }) => useInteractiveState(disabled), {
        initialProps: { disabled: false },
      })

      // Initially enabled - should have handlers
      expect(result.current.interactiveProps.onMouseEnter).toBeDefined()

      // Disable
      rerender({ disabled: true })

      // Should remove handlers
      expect(result.current.interactiveProps).toEqual({})

      // Re-enable
      rerender({ disabled: false })

      // Should add handlers back
      expect(result.current.interactiveProps.onMouseEnter).toBeDefined()
    })
  })

  describe('Memoization', () => {
    beforeEach(() => {
      Object.defineProperty(Platform, 'OS', {
        value: 'web',
        writable: true,
      })
    })

    it('should memoize interactiveProps when disabled does not change', () => {
      const { result, rerender } = renderHook(() => useInteractiveState(false))

      const firstProps = result.current.interactiveProps

      rerender()

      const secondProps = result.current.interactiveProps

      // Should be the same reference
      expect(firstProps).toBe(secondProps)
    })

    it('should recreate interactiveProps when disabled changes', () => {
      const { result, rerender } = renderHook(({ disabled }) => useInteractiveState(disabled), {
        initialProps: { disabled: false },
      })

      const enabledProps = result.current.interactiveProps

      rerender({ disabled: true })

      const disabledProps = result.current.interactiveProps

      // Should be different references
      expect(enabledProps).not.toBe(disabledProps)
    })
  })

  describe('Real-world usage patterns', () => {
    beforeEach(() => {
      Object.defineProperty(Platform, 'OS', {
        value: 'web',
        writable: true,
      })
    })

    it('should work with button hover states', () => {
      const { result } = renderHook(() => useInteractiveState(false))

      // Simulate user hovering over button
      act(() => {
        result.current.interactiveProps.onMouseEnter?.()
      })

      expect(result.current.isHovered).toBe(true)

      // Can use this in component: style={isHovered && styles.hover}
      const shouldApplyHoverStyle = result.current.isHovered
      expect(shouldApplyHoverStyle).toBe(true)

      // Simulate user leaving button
      act(() => {
        result.current.interactiveProps.onMouseLeave?.()
      })

      expect(result.current.isHovered).toBe(false)
    })

    it('should work with focus rings', () => {
      const { result } = renderHook(() => useInteractiveState(false))

      // Simulate keyboard navigation to element
      act(() => {
        result.current.interactiveProps.onFocus?.()
      })

      expect(result.current.isFocused).toBe(true)

      // Can use this in component: style={isFocused && styles.focusRing}
      const shouldShowFocusRing = result.current.isFocused
      expect(shouldShowFocusRing).toBe(true)

      // Simulate moving focus away
      act(() => {
        result.current.interactiveProps.onBlur?.()
      })

      expect(result.current.isFocused).toBe(false)
    })

    it('should handle rapid hover events', () => {
      const { result } = renderHook(() => useInteractiveState(false))

      // Rapidly enter and leave
      act(() => {
        result.current.interactiveProps.onMouseEnter?.()
      })
      expect(result.current.isHovered).toBe(true)

      act(() => {
        result.current.interactiveProps.onMouseLeave?.()
      })
      expect(result.current.isHovered).toBe(false)

      act(() => {
        result.current.interactiveProps.onMouseEnter?.()
      })
      expect(result.current.isHovered).toBe(true)

      act(() => {
        result.current.interactiveProps.onMouseLeave?.()
      })
      expect(result.current.isHovered).toBe(false)
    })

    it('should work with disabled button that becomes enabled', () => {
      const { result, rerender } = renderHook(({ disabled }) => useInteractiveState(disabled), {
        initialProps: { disabled: true },
      })

      // Try to hover while disabled
      const disabledProps = result.current.interactiveProps
      expect(disabledProps).toEqual({})

      // Enable the button
      rerender({ disabled: false })

      // Now hover should work
      act(() => {
        result.current.interactiveProps.onMouseEnter?.()
      })

      expect(result.current.isHovered).toBe(true)
    })
  })

  describe('Edge cases', () => {
    it('should handle undefined disabled parameter', () => {
      const { result } = renderHook(() => useInteractiveState(undefined))

      // Should default to false (not disabled)
      if (Platform.OS === 'web') {
        expect(result.current.interactiveProps.onMouseEnter).toBeDefined()
      }
    })

    it('should not throw when handlers are called with undefined', () => {
      Object.defineProperty(Platform, 'OS', {
        value: 'web',
        writable: true,
      })

      const { result } = renderHook(() => useInteractiveState(false))

      expect(() => {
        act(() => {
          result.current.interactiveProps.onMouseEnter?.()
          result.current.interactiveProps.onMouseLeave?.()
          result.current.interactiveProps.onFocus?.()
          result.current.interactiveProps.onBlur?.()
        })
      }).not.toThrow()
    })
  })
})
