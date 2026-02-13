/**
 * useResponsive hook
 * Provides responsive utilities for adapting layout based on screen size
 *
 * @example
 * ```tsx
 * import { useResponsive } from '@scaffald/ui'
 *
 * function MyComponent() {
 *   const { breakpoint, isMobile, isDesktop, select } = useResponsive()
 *
 *   // Use current breakpoint
 *   console.log(breakpoint) // 'md'
 *
 *   // Boolean checks
 *   if (isMobile) return <MobileLayout />
 *
 *   // Select value based on breakpoint
 *   const padding = select({
 *     base: 8,
 *     sm: 16,
 *     md: 24,
 *     lg: 32,
 *   })
 *
 *   return <Box padding={padding}>...</Box>
 * }
 * ```
 */

import { useState, useEffect, useCallback } from 'react'
import { useWindowDimensions, Platform } from 'react-native'
import { breakpoints, getCurrentBreakpoint, type Breakpoint } from '../tokens/breakpoints'

/**
 * Responsive value map - specify values for different breakpoints
 * Values are inherited upward (base -> xs -> sm -> md -> lg -> xl -> xxl)
 */
export type ResponsiveValue<T> = {
  /** Base value (smallest screens, below xs) */
  base?: T
  /** Extra small screens (660px+) */
  xs?: T
  /** Small screens (800px+) */
  sm?: T
  /** Medium screens (1020px+) */
  md?: T
  /** Large screens (1280px+) */
  lg?: T
  /** Extra large screens (1420px+) */
  xl?: T
  /** Extra extra large screens (1600px+) */
  xxl?: T
}

/**
 * Responsive hook return type
 */
export interface UseResponsiveReturn {
  /** Current screen width */
  width: number
  /** Current screen height */
  height: number
  /** Current breakpoint name */
  breakpoint: Breakpoint | 'base'
  /** True if screen is below sm breakpoint (mobile) */
  isMobile: boolean
  /** True if screen is between sm and lg breakpoints (tablet) */
  isTablet: boolean
  /** True if screen is lg or above (desktop) */
  isDesktop: boolean
  /**
   * Select a value based on current breakpoint
   * Values inherit upward: base -> xs -> sm -> md -> lg -> xl -> xxl
   */
  select: <T>(values: ResponsiveValue<T>) => T | undefined
  /**
   * Check if current screen matches or exceeds a breakpoint
   */
  atLeast: (bp: Breakpoint) => boolean
  /**
   * Check if current screen is below a breakpoint
   */
  below: (bp: Breakpoint) => boolean
}

/**
 * Select a value based on breakpoint, with inheritance
 */
function selectValue<T>(
  values: ResponsiveValue<T>,
  width: number
): T | undefined {
  const breakpointOrder: (keyof ResponsiveValue<T>)[] = [
    'xxl',
    'xl',
    'lg',
    'md',
    'sm',
    'xs',
    'base',
  ]

  // Find the first matching breakpoint value
  for (const bp of breakpointOrder) {
    if (values[bp] !== undefined) {
      if (bp === 'base') return values[bp]
      if (width >= breakpoints[bp as Breakpoint]) return values[bp]
    }
  }

  return values.base
}

/**
 * Hook for responsive design utilities
 * Uses useWindowDimensions for React Native compatibility
 */
export function useResponsive(): UseResponsiveReturn {
  const dimensions = useWindowDimensions()

  // For web, we can also listen to window resize events for better performance
  const [width, setWidth] = useState(dimensions.width)
  const [height, setHeight] = useState(dimensions.height)

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleResize = () => {
        setWidth(window.innerWidth)
        setHeight(window.innerHeight)
      }

      window.addEventListener('resize', handleResize)
      handleResize() // Set initial value

      return () => window.removeEventListener('resize', handleResize)
    }
    // For native, use the dimensions from useWindowDimensions
    setWidth(dimensions.width)
    setHeight(dimensions.height)
  }, [dimensions.width, dimensions.height])

  const breakpoint = width >= breakpoints.xs ? getCurrentBreakpoint(width) : 'base'
  const isMobile = width < breakpoints.sm
  const isTablet = width >= breakpoints.sm && width < breakpoints.lg
  const isDesktop = width >= breakpoints.lg

  const select = useCallback(
    <T>(values: ResponsiveValue<T>): T | undefined => {
      return selectValue(values, width)
    },
    [width]
  )

  const atLeast = useCallback(
    (bp: Breakpoint): boolean => {
      return width >= breakpoints[bp]
    },
    [width]
  )

  const below = useCallback(
    (bp: Breakpoint): boolean => {
      return width < breakpoints[bp]
    },
    [width]
  )

  return {
    width,
    height,
    breakpoint,
    isMobile,
    isTablet,
    isDesktop,
    select,
    atLeast,
    below,
  }
}

export type { Breakpoint }
