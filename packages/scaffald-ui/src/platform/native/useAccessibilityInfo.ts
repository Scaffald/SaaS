/**
 * useAccessibilityInfo hook
 * Provides access to native accessibility settings
 *
 * @example
 * ```tsx
 * import { useAccessibilityInfo } from '@scaffald/ui'
 *
 * function MyComponent() {
 *   const {
 *     isScreenReaderEnabled,
 *     isBoldTextEnabled,
 *     isReduceMotionEnabled,
 *     isReduceTransparencyEnabled,
 *   } = useAccessibilityInfo()
 *
 *   return (
 *     <View>
 *       {isReduceMotionEnabled && <StaticContent />}
 *       {!isReduceMotionEnabled && <AnimatedContent />}
 *     </View>
 *   )
 * }
 * ```
 */

import { useState, useEffect } from 'react'
import { AccessibilityInfo } from 'react-native'
import { Platform } from '../Platform'

export interface UseAccessibilityInfoReturn {
  /** Whether a screen reader is currently enabled */
  isScreenReaderEnabled: boolean
  /** Whether bold text is enabled (iOS) */
  isBoldTextEnabled: boolean
  /** Whether reduce motion is enabled */
  isReduceMotionEnabled: boolean
  /** Whether reduce transparency is enabled (iOS) */
  isReduceTransparencyEnabled: boolean
  /** Whether grayscale mode is enabled (Android) */
  isGrayscaleEnabled: boolean
  /** Whether invert colors is enabled (iOS) */
  isInvertColorsEnabled: boolean
}

/**
 * Hook for accessing native accessibility settings
 */
export function useAccessibilityInfo(): UseAccessibilityInfoReturn {
  const [state, setState] = useState<UseAccessibilityInfoReturn>({
    isScreenReaderEnabled: false,
    isBoldTextEnabled: false,
    isReduceMotionEnabled: false,
    isReduceTransparencyEnabled: false,
    isGrayscaleEnabled: false,
    isInvertColorsEnabled: false,
  })

  useEffect(() => {
    // On web, use CSS media queries
    if (Platform.isWeb) {
      if (typeof window === 'undefined') return

      const updateFromMediaQueries = () => {
        setState({
          isScreenReaderEnabled: false, // Can't detect on web
          isBoldTextEnabled: false, // Can't detect on web
          isReduceMotionEnabled: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
          isReduceTransparencyEnabled: window.matchMedia('(prefers-reduced-transparency: reduce)').matches,
          isGrayscaleEnabled: false, // Can't detect on web
          isInvertColorsEnabled: window.matchMedia('(inverted-colors: inverted)').matches,
        })
      }

      updateFromMediaQueries()

      // Listen for changes
      const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
      const transparencyQuery = window.matchMedia('(prefers-reduced-transparency: reduce)')
      const invertQuery = window.matchMedia('(inverted-colors: inverted)')

      const handleChange = () => updateFromMediaQueries()

      motionQuery.addEventListener?.('change', handleChange)
      transparencyQuery.addEventListener?.('change', handleChange)
      invertQuery.addEventListener?.('change', handleChange)

      return () => {
        motionQuery.removeEventListener?.('change', handleChange)
        transparencyQuery.removeEventListener?.('change', handleChange)
        invertQuery.removeEventListener?.('change', handleChange)
      }
    }

    // On native, use AccessibilityInfo
    const fetchInitialState = async () => {
      const [
        screenReader,
        boldText,
        reduceMotion,
        reduceTransparency,
        grayscale,
        invertColors,
      ] = await Promise.all([
        AccessibilityInfo.isScreenReaderEnabled(),
        AccessibilityInfo.isBoldTextEnabled?.() ?? Promise.resolve(false),
        AccessibilityInfo.isReduceMotionEnabled(),
        AccessibilityInfo.isReduceTransparencyEnabled?.() ?? Promise.resolve(false),
        AccessibilityInfo.isGrayscaleEnabled?.() ?? Promise.resolve(false),
        AccessibilityInfo.isInvertColorsEnabled?.() ?? Promise.resolve(false),
      ])

      setState({
        isScreenReaderEnabled: screenReader,
        isBoldTextEnabled: boldText,
        isReduceMotionEnabled: reduceMotion,
        isReduceTransparencyEnabled: reduceTransparency,
        isGrayscaleEnabled: grayscale,
        isInvertColorsEnabled: invertColors,
      })
    }

    fetchInitialState()

    // Subscribe to changes
    const subscriptions = [
      AccessibilityInfo.addEventListener('screenReaderChanged', (isEnabled) => {
        setState((prev) => ({ ...prev, isScreenReaderEnabled: isEnabled }))
      }),
      AccessibilityInfo.addEventListener('boldTextChanged', (isEnabled) => {
        setState((prev) => ({ ...prev, isBoldTextEnabled: isEnabled }))
      }),
      AccessibilityInfo.addEventListener('reduceMotionChanged', (isEnabled) => {
        setState((prev) => ({ ...prev, isReduceMotionEnabled: isEnabled }))
      }),
      AccessibilityInfo.addEventListener('reduceTransparencyChanged', (isEnabled) => {
        setState((prev) => ({ ...prev, isReduceTransparencyEnabled: isEnabled }))
      }),
      AccessibilityInfo.addEventListener('grayscaleChanged', (isEnabled) => {
        setState((prev) => ({ ...prev, isGrayscaleEnabled: isEnabled }))
      }),
      AccessibilityInfo.addEventListener('invertColorsChanged', (isEnabled) => {
        setState((prev) => ({ ...prev, isInvertColorsEnabled: isEnabled }))
      }),
    ]

    return () => {
      subscriptions.forEach((subscription) => subscription.remove())
    }
  }, [])

  return state
}
