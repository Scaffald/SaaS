/**
 * useAnimatedTiming hook
 * Provides a simple API for timing-based animations with Reanimated
 *
 * This hook wraps Reanimated's useSharedValue and withTiming for common
 * animation patterns. Falls back to a simple state-based implementation
 * if Reanimated is not available.
 *
 * @example
 * ```tsx
 * import { useAnimatedTiming } from '@scaffald/ui'
 *
 * function FadeComponent() {
 *   const { animatedStyle, animate } = useAnimatedTiming({
 *     initialValue: 0,
 *     property: 'opacity',
 *     duration: 'normal',
 *   })
 *
 *   useEffect(() => {
 *     animate(1) // Fade in on mount
 *   }, [])
 *
 *   return (
 *     <AnimatedView style={animatedStyle}>
 *       <Text>Fading content</Text>
 *     </AnimatedView>
 *   )
 * }
 * ```
 */

import { useState, useCallback, useMemo } from 'react'
import type { ViewStyle } from 'react-native'
import { timingConfigs, type TimingConfigKey } from './presets'
import { useReducedMotion } from './useReducedMotion'
import {
  Easing,
  isReanimatedLoaded,
  useSharedValueAsserted,
  useAnimatedStyleAsserted,
  withTimingAsserted,
  type TimingConfig,
  type EasingFunctions,
} from './reanimated.types'

export type EasingType = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut'

export interface UseAnimatedTimingOptions {
  /**
   * Initial value for the animation
   * @default 0
   */
  initialValue?: number

  /**
   * Timing duration preset or custom duration in ms
   * @default 'normal'
   */
  duration?: TimingConfigKey | number

  /**
   * Easing function type
   * @default 'easeOut'
   */
  easing?: EasingType

  /**
   * Property to animate
   * @default 'opacity'
   */
  property?: 'scale' | 'opacity' | 'translateX' | 'translateY' | 'rotate' | 'height'
}

export interface UseAnimatedTimingReturn {
  /**
   * Current animated value
   */
  value: number

  /**
   * Animated style object to spread on an AnimatedView
   */
  animatedStyle: ViewStyle

  /**
   * Animate to a new value
   */
  animate: (toValue: number, callback?: () => void) => void

  /**
   * Whether Reanimated is being used
   */
  isAnimated: boolean
}

type AnimatedProperty = 'scale' | 'opacity' | 'translateX' | 'translateY' | 'rotate' | 'height'

/**
 * Convert property and value to ViewStyle
 */
function createStyle(property: AnimatedProperty, value: number): ViewStyle {
  switch (property) {
    case 'scale':
      return { transform: [{ scale: value }] }
    case 'opacity':
      return { opacity: value }
    case 'translateX':
      return { transform: [{ translateX: value }] }
    case 'translateY':
      return { transform: [{ translateY: value }] }
    case 'rotate':
      return { transform: [{ rotate: `${value}deg` }] }
    case 'height':
      return { height: value }
    default:
      return {}
  }
}

/**
 * Get Reanimated Easing function from type
 */
function getEasingFunction(
  easingFns: EasingFunctions | null,
  type: EasingType
): ((t: number) => number) | undefined {
  if (!easingFns) return undefined

  switch (type) {
    case 'linear':
      return easingFns.linear
    case 'easeIn':
      return easingFns.in(easingFns.quad)
    case 'easeOut':
      return easingFns.out(easingFns.quad)
    case 'easeInOut':
      return easingFns.inOut(easingFns.quad)
    default:
      return easingFns.out(easingFns.quad)
  }
}

/**
 * Get duration in milliseconds from preset or number
 */
function getDurationMs(duration: TimingConfigKey | number): number {
  if (typeof duration === 'number') {
    return duration
  }
  return timingConfigs[duration]?.duration ?? 300
}

/**
 * Reanimated-based timing implementation (only used when Reanimated is available)
 */
function useAnimatedTimingReanimated(
  options: UseAnimatedTimingOptions = {}
): UseAnimatedTimingReturn {
  const {
    initialValue = 0,
    duration = 'normal',
    easing = 'easeOut',
    property = 'opacity',
  } = options

  const prefersReducedMotion = useReducedMotion()
  const durationMs = getDurationMs(duration)
  const easingFn = getEasingFunction(Easing, easing)

  // Use asserted versions since this function only runs when Reanimated is available
  const sharedValue = useSharedValueAsserted(initialValue)

  const animatedStyle = useAnimatedStyleAsserted(() => {
    'worklet'
    return createStyle(property, sharedValue.value)
  }, [property])

  // Build timing config
  const timingConfig: TimingConfig = useMemo(
    () => ({ duration: prefersReducedMotion ? 0 : durationMs, easing: easingFn }),
    [durationMs, easingFn, prefersReducedMotion]
  )

  const animate = useCallback(
    (toValue: number, callback?: () => void) => {
      if (prefersReducedMotion) {
        // Skip animation for reduced motion - instant transition
        sharedValue.value = toValue
        callback?.()
      } else {
        sharedValue.value = withTimingAsserted(
          toValue,
          timingConfig,
          callback ? () => { 'worklet'; callback() } : undefined
        )
      }
    },
    [sharedValue, timingConfig, prefersReducedMotion]
  )

  return {
    value: sharedValue.value,
    animatedStyle,
    animate,
    isAnimated: !prefersReducedMotion,
  }
}

/**
 * Fallback state-based implementation (instant transitions)
 */
function useAnimatedTimingFallback(
  options: UseAnimatedTimingOptions = {}
): UseAnimatedTimingReturn {
  const {
    initialValue = 0,
    property = 'opacity',
  } = options

  const [currentValue, setCurrentValue] = useState(initialValue)

  const animatedStyle = useMemo(
    () => createStyle(property, currentValue),
    [property, currentValue]
  )

  const animate = useCallback((toValue: number, callback?: () => void) => {
    setCurrentValue(toValue)
    callback?.()
  }, [])

  return {
    value: currentValue,
    animatedStyle,
    animate,
    isAnimated: false,
  }
}

/**
 * Hook for timing-based animations with graceful fallback.
 * Uses Reanimated when available, instant state updates otherwise.
 */
export const useAnimatedTiming = isReanimatedLoaded
  ? useAnimatedTimingReanimated
  : useAnimatedTimingFallback
