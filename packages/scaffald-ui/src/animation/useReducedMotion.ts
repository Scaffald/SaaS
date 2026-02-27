/**
 * useReducedMotion hook
 * Detects whether the user prefers reduced motion
 *
 * Respects OS-level accessibility settings on both web and native platforms.
 * When enabled, animations should be minimized or disabled.
 *
 * @example
 * ```tsx
 * function AnimatedComponent() {
 *   const prefersReducedMotion = useReducedMotion()
 *
 *   const animationDuration = prefersReducedMotion ? 0 : 300
 *   // Use animationDuration in your animations
 * }
 * ```
 */

import { useState, useEffect } from 'react'
import { AccessibilityInfo, Platform } from 'react-native'

/**
 * Hook that returns whether the user prefers reduced motion
 *
 * - On native: Uses AccessibilityInfo.isReduceMotionEnabled()
 * - On web: Uses CSS media query prefers-reduced-motion
 *
 * @returns boolean - true if reduced motion is preferred
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    if (Platform.OS === 'web') {
      // Web: Use CSS media query
      if (typeof window !== 'undefined' && window.matchMedia) {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
        setPrefersReducedMotion(mediaQuery.matches)

        const handleChange = (event: MediaQueryListEvent) => {
          setPrefersReducedMotion(event.matches)
        }

        // Modern browsers
        if (mediaQuery.addEventListener) {
          mediaQuery.addEventListener('change', handleChange)
          return () => mediaQuery.removeEventListener('change', handleChange)
        }
        // Legacy browsers (Safari < 14)
        mediaQuery.addListener(handleChange)
        return () => mediaQuery.removeListener(handleChange)
      }
    } else {
      // Native: Use AccessibilityInfo
      AccessibilityInfo.isReduceMotionEnabled().then(setPrefersReducedMotion)

      const subscription = AccessibilityInfo.addEventListener(
        'reduceMotionChanged',
        setPrefersReducedMotion
      )

      return () => {
        subscription.remove()
      }
    }
  }, [])

  return prefersReducedMotion
}
