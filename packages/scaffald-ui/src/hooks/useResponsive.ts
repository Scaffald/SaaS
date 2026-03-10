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

import { useSyncExternalStore, useCallback } from 'react'
import { Platform, Dimensions } from 'react-native'
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

// ── Shared snapshot type ──────────────────────────────────────────────────────

type Snapshot = { readonly width: number; readonly height: number }

// ── Web singleton store ───────────────────────────────────────────────────────
// One module-level store means ONE resize listener shared across ALL
// useResponsive() instances. This prevents the per-instance useState/useEffect
// cascade that triggers React's "Maximum update depth exceeded" error when
// many Box/Stack/Grid components are mounted simultaneously.

let _webSnapshot: Snapshot = { width: 0, height: 0 }
const _webListeners = new Set<() => void>()

function _readWebDimensions(): { width: number; height: number } {
  if (typeof window === 'undefined') return { width: 1280, height: 900 }
  if (window.visualViewport) {
    return {
      width: Math.round(window.visualViewport.width * window.visualViewport.scale),
      height: Math.round(window.visualViewport.height * window.visualViewport.scale),
    }
  }
  return {
    width: window.document.documentElement.clientWidth,
    height: window.innerHeight,
  }
}

function _updateWebStore() {
  const { width, height } = _readWebDimensions()
  if (width !== _webSnapshot.width || height !== _webSnapshot.height) {
    _webSnapshot = { width, height }
    _webListeners.forEach((fn) => { fn() })
  }
}

function _subscribeWeb(listener: () => void): () => void {
  if (_webListeners.size === 0 && typeof window !== 'undefined') {
    // Attach the single shared listener only on first subscriber
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', _updateWebStore)
    } else {
      window.addEventListener('resize', _updateWebStore)
    }
  }
  _webListeners.add(listener)
  return () => {
    _webListeners.delete(listener)
    if (_webListeners.size === 0 && typeof window !== 'undefined') {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', _updateWebStore)
      } else {
        window.removeEventListener('resize', _updateWebStore)
      }
    }
  }
}

function _getWebSnapshot(): Snapshot {
  return _webSnapshot
}

function _getServerSnapshot(): Snapshot {
  return { width: 1280, height: 900 }
}

// Initialize web store immediately on module load
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  const initial = _readWebDimensions()
  _webSnapshot = initial
}

// ── Native singleton store ────────────────────────────────────────────────────

let _nativeSnapshot: Snapshot = (() => {
  if (Platform.OS !== 'web') {
    const d = Dimensions.get('window')
    return { width: d.width, height: d.height }
  }
  return { width: 0, height: 0 }
})()

const _nativeListeners = new Set<() => void>()
let _nativeSubscription: ReturnType<typeof Dimensions.addEventListener> | null = null

function _subscribeNative(listener: () => void): () => void {
  if (_nativeListeners.size === 0) {
    _nativeSubscription = Dimensions.addEventListener('change', ({ window: w }) => {
      if (w.width !== _nativeSnapshot.width || w.height !== _nativeSnapshot.height) {
        _nativeSnapshot = { width: w.width, height: w.height }
        _nativeListeners.forEach((fn) => { fn() })
      }
    })
  }
  _nativeListeners.add(listener)
  return () => {
    _nativeListeners.delete(listener)
    if (_nativeListeners.size === 0 && _nativeSubscription) {
      _nativeSubscription.remove()
      _nativeSubscription = null
    }
  }
}

function _getNativeSnapshot(): Snapshot {
  return _nativeSnapshot
}

// ── Platform-selected store (stable module-level references) ─────────────────

const _subscribe = Platform.OS === 'web' ? _subscribeWeb : _subscribeNative
const _getSnapshot = Platform.OS === 'web' ? _getWebSnapshot : _getNativeSnapshot

// ── Breakpoint helpers ────────────────────────────────────────────────────────

function selectValue<T>(values: ResponsiveValue<T>, width: number): T | undefined {
  const order: (keyof ResponsiveValue<T>)[] = ['xxl', 'xl', 'lg', 'md', 'sm', 'xs', 'base']
  for (const bp of order) {
    if (values[bp] !== undefined) {
      if (bp === 'base') return values[bp]
      if (width >= breakpoints[bp as Breakpoint]) return values[bp]
    }
  }
  return values.base
}

/**
 * Hook for responsive design utilities.
 *
 * Uses a module-level singleton store (not per-instance useState) so that all
 * components share ONE resize event listener. This prevents the cascading
 * setState pattern that exhausts React's nested-update limit when many layout
 * primitives (Box/Stack/Grid) are mounted in the same tree.
 */
export function useResponsive(): UseResponsiveReturn {
  const { width, height } = useSyncExternalStore(_subscribe, _getSnapshot, _getServerSnapshot)

  const breakpoint = width >= breakpoints.xs ? getCurrentBreakpoint(width) : 'base'
  const isMobile = width < breakpoints.sm
  const isTablet = width >= breakpoints.sm && width < breakpoints.lg
  const isDesktop = width >= breakpoints.lg

  const select = useCallback(
    <T>(values: ResponsiveValue<T>): T | undefined => selectValue(values, width),
    [width]
  )

  const atLeast = useCallback((bp: Breakpoint): boolean => width >= breakpoints[bp], [width])

  const below = useCallback((bp: Breakpoint): boolean => width < breakpoints[bp], [width])

  return { width, height, breakpoint, isMobile, isTablet, isDesktop, select, atLeast, below }
}

export type { Breakpoint }
