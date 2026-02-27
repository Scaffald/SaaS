/**
 * Responsive utilities
 * Helper functions for resolving responsive prop values based on breakpoints
 */

import type { ResponsiveValue } from '../hooks/useResponsive'
import type { Breakpoint } from '../tokens/breakpoints'
import { breakpoints } from '../tokens/breakpoints'

/**
 * Resolve a responsive value based on current screen width
 * Values inherit upward: base -> xs -> sm -> md -> lg -> xl -> xxl
 *
 * @example
 * ```tsx
 * const padding = resolveResponsiveValue({ base: 8, md: 16, lg: 24 }, 1200)
 * // Returns 16 (md value) because 1200px is at md breakpoint
 * ```
 */
export function resolveResponsiveValue<T>(value: T | ResponsiveValue<T>, width: number): T {
  // If not a responsive value object, return as-is
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return value as T
  }

  const responsiveValue = value as ResponsiveValue<T>

  // Breakpoint order from largest to smallest
  const breakpointOrder: Array<keyof ResponsiveValue<T>> = [
    'xxl',
    'xl',
    'lg',
    'md',
    'sm',
    'xs',
    'base',
  ]

  // Find the appropriate value based on width
  for (const bp of breakpointOrder) {
    const bpValue = responsiveValue[bp]
    if (bpValue !== undefined) {
      // Check if width matches this breakpoint
      if (bp === 'base') {
        return bpValue
      }
      const bpWidth = breakpoints[bp as Breakpoint]
      if (width >= bpWidth) {
        return bpValue
      }
    }
  }

  // Fallback to base value or undefined
  return responsiveValue.base as T
}

/**
 * Check if a value is a responsive value object
 */
export function isResponsiveValue<T>(value: unknown): value is ResponsiveValue<T> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false
  }

  // Check if it has at least one responsive breakpoint key
  const responsiveKeys = ['base', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl']
  return Object.keys(value as object).some((key) => responsiveKeys.includes(key))
}

/**
 * Resolve multiple responsive values at once
 * Useful for components that need to resolve several props
 *
 * @example
 * ```tsx
 * const { gap, padding } = resolveResponsiveValues(
 *   { gap: { base: 8, md: 16 }, padding: { base: 12, lg: 24 } },
 *   1200
 * )
 * ```
 */
export function resolveResponsiveValues<T extends Record<string, unknown>>(
  values: T,
  width: number
): T {
  const resolved = {} as T

  for (const key in values) {
    // biome-ignore lint/suspicious/noPrototypeBuiltins: TypeScript lib compatibility
    if (Object.prototype.hasOwnProperty.call(values, key)) {
      resolved[key] = resolveResponsiveValue(values[key], width)
    }
  }

  return resolved
}
