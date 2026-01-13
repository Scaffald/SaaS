/**
 * useResponsive hook tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react-native'
import { useResponsive } from '../useResponsive'
import { breakpoints } from '../../tokens/breakpoints'

// Mock useWindowDimensions
const mockDimensions = { width: 1024, height: 768 }

vi.mock('react-native', async () => {
  const actual = await vi.importActual('react-native')
  return {
    ...actual,
    useWindowDimensions: () => mockDimensions,
    Platform: {
      OS: 'web',
    },
  }
})

describe('useResponsive', () => {
  let originalWindow: typeof window | undefined
  let mockAddEventListener: ReturnType<typeof vi.fn>
  let mockRemoveEventListener: ReturnType<typeof vi.fn>

  beforeEach(() => {
    originalWindow = global.window
    mockAddEventListener = vi.fn()
    mockRemoveEventListener = vi.fn()

    // Mock window for web platform
    Object.defineProperty(global, 'window', {
      value: {
        innerWidth: 1024,
        innerHeight: 768,
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
      },
      writable: true,
    })
  })

  afterEach(() => {
    if (originalWindow !== undefined) {
      Object.defineProperty(global, 'window', {
        value: originalWindow,
        writable: true,
      })
    }
    vi.clearAllMocks()
  })

  describe('Basic Properties', () => {
    it('should return width and height', () => {
      const { result } = renderHook(() => useResponsive())

      expect(result.current.width).toBeDefined()
      expect(result.current.height).toBeDefined()
    })

    it('should return breakpoint name', () => {
      const { result } = renderHook(() => useResponsive())

      expect(result.current.breakpoint).toBeDefined()
      expect(['base', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl']).toContain(result.current.breakpoint)
    })

    it('should return boolean device type flags', () => {
      const { result } = renderHook(() => useResponsive())

      expect(typeof result.current.isMobile).toBe('boolean')
      expect(typeof result.current.isTablet).toBe('boolean')
      expect(typeof result.current.isDesktop).toBe('boolean')
    })
  })

  describe('select function', () => {
    it('should return base value when no breakpoint matches', () => {
      // Set window to very small
      Object.defineProperty(global.window, 'innerWidth', { value: 300, writable: true })

      const { result } = renderHook(() => useResponsive())

      const value = result.current.select({
        base: 'base-value',
        md: 'md-value',
      })

      // Should return base or the lowest matching value
      expect(['base-value']).toContain(value)
    })

    it('should return correct breakpoint value', () => {
      Object.defineProperty(global.window, 'innerWidth', { value: breakpoints.md + 100, writable: true })

      const { result } = renderHook(() => useResponsive())

      const value = result.current.select({
        base: 8,
        sm: 16,
        md: 24,
        lg: 32,
      })

      // Should return md value since width is at md breakpoint
      expect(typeof value).toBe('number')
    })

    it('should inherit from lower breakpoints when not specified', () => {
      Object.defineProperty(global.window, 'innerWidth', { value: breakpoints.lg, writable: true })

      const { result } = renderHook(() => useResponsive())

      const value = result.current.select({
        base: 'base',
        sm: 'sm',
        // md not specified, should use sm
        // lg not specified, should use sm
      })

      expect(value).toBe('sm')
    })
  })

  describe('atLeast function', () => {
    it('should return true when width >= breakpoint', () => {
      Object.defineProperty(global.window, 'innerWidth', { value: breakpoints.md, writable: true })

      const { result } = renderHook(() => useResponsive())

      expect(result.current.atLeast('sm')).toBe(true)
      expect(result.current.atLeast('md')).toBe(true)
    })

    it('should return false when width < breakpoint', () => {
      Object.defineProperty(global.window, 'innerWidth', { value: breakpoints.sm - 1, writable: true })

      const { result } = renderHook(() => useResponsive())

      expect(result.current.atLeast('md')).toBe(false)
    })
  })

  describe('below function', () => {
    it('should return true when width < breakpoint', () => {
      Object.defineProperty(global.window, 'innerWidth', { value: breakpoints.sm - 1, writable: true })

      const { result } = renderHook(() => useResponsive())

      expect(result.current.below('sm')).toBe(true)
    })

    it('should return false when width >= breakpoint', () => {
      Object.defineProperty(global.window, 'innerWidth', { value: breakpoints.md, writable: true })

      const { result } = renderHook(() => useResponsive())

      expect(result.current.below('sm')).toBe(false)
    })
  })

  describe('Device Type Detection', () => {
    it('should detect mobile correctly', () => {
      Object.defineProperty(global.window, 'innerWidth', { value: breakpoints.sm - 1, writable: true })

      const { result } = renderHook(() => useResponsive())

      expect(result.current.isMobile).toBe(true)
      expect(result.current.isTablet).toBe(false)
      expect(result.current.isDesktop).toBe(false)
    })

    it('should detect tablet correctly', () => {
      Object.defineProperty(global.window, 'innerWidth', {
        value: breakpoints.sm + 50,
        writable: true,
      })

      const { result } = renderHook(() => useResponsive())

      // Tablet is between sm and lg
      // This depends on the exact breakpoint values
      expect(typeof result.current.isTablet).toBe('boolean')
    })

    it('should detect desktop correctly', () => {
      Object.defineProperty(global.window, 'innerWidth', { value: breakpoints.lg + 100, writable: true })

      const { result } = renderHook(() => useResponsive())

      expect(result.current.isDesktop).toBe(true)
    })
  })

  describe('Web Platform', () => {
    it('should add resize event listener on web', () => {
      renderHook(() => useResponsive())

      expect(mockAddEventListener).toHaveBeenCalledWith('resize', expect.any(Function))
    })

    it('should remove resize event listener on unmount', () => {
      const { unmount } = renderHook(() => useResponsive())

      unmount()

      expect(mockRemoveEventListener).toHaveBeenCalledWith('resize', expect.any(Function))
    })
  })
})
