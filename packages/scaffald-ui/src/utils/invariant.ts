/**
 * Invariant utility for runtime assertion
 *
 * Throws an error with a helpful message when a condition is not met.
 * Used for validating component props and internal state.
 *
 * @example
 * ```tsx
 * import { invariant } from '@scaffald/ui'
 *
 * function MyComponent({ items }: Props) {
 *   invariant(items.length > 0, 'items array cannot be empty', 'MyComponent')
 *   // ...
 * }
 * ```
 */

/**
 * Assert that a condition is truthy, throwing an error if not
 *
 * @param condition - The condition to check
 * @param message - Error message describing what went wrong
 * @param componentName - Optional component name for better error context
 * @throws Error with formatted message if condition is falsy
 */
export function invariant(
  condition: unknown,
  message: string,
  componentName?: string
): asserts condition {
  if (!condition) {
    const prefix = componentName
      ? `[beyond-ui/${componentName}]`
      : '[beyond-ui]'

    // In development, throw with full message
    if (process.env.NODE_ENV !== 'production') {
      throw new Error(`${prefix} ${message}`)
    }

    // In production, throw with minimal message to reduce bundle size
    throw new Error(prefix)
  }
}

/**
 * Warning utility for development-only warnings
 *
 * Logs a warning message in development mode only.
 * Useful for deprecation notices or recommending better patterns.
 *
 * @param condition - If truthy, the warning is suppressed
 * @param message - Warning message to display
 * @param componentName - Optional component name for better context
 */
export function warning(
  condition: unknown,
  message: string,
  componentName?: string
): void {
  if (process.env.NODE_ENV !== 'production' && !condition) {
    const prefix = componentName
      ? `[beyond-ui/${componentName}]`
      : '[beyond-ui]'

    // eslint-disable-next-line no-console
    console.warn(`${prefix} Warning: ${message}`)
  }
}

/**
 * Deprecation warning utility
 *
 * Logs a deprecation warning in development mode.
 * Tracks which deprecations have been shown to avoid spam.
 *
 * @param feature - The deprecated feature name
 * @param replacement - The recommended replacement
 * @param componentName - Optional component name for better context
 */
const shownDeprecations = new Set<string>()

export function deprecated(
  feature: string,
  replacement: string,
  componentName?: string
): void {
  if (process.env.NODE_ENV !== 'production') {
    const key = `${componentName || ''}:${feature}`

    // Only show each deprecation once per session
    if (shownDeprecations.has(key)) {
      return
    }
    shownDeprecations.add(key)

    const prefix = componentName
      ? `[beyond-ui/${componentName}]`
      : '[beyond-ui]'

    // eslint-disable-next-line no-console
    console.warn(
      `${prefix} Deprecation: "${feature}" is deprecated. Use "${replacement}" instead.`
    )
  }
}
