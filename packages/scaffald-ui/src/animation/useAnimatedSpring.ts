/**
 * useAnimatedSpring hook
 * Provides spring-based animations with graceful fallback
 *
 * Uses Reanimated when available, falls back to instant state updates otherwise.
 * Respects user's reduced motion preferences.
 *
 * @example
 * ```tsx
 * import { useAnimatedSpring } from '@scaffald/ui'
 *
 * function ScaleButton() {
 *   const { animatedStyle, animate } = useAnimatedSpring({
 *     initialValue: 1,
 *     springConfig: 'snappy',
 *     property: 'scale',
 *   })
 *
 *   return (
 *     <AnimatedView
 *       style={animatedStyle}
 *       onPressIn={() => animate(0.95)}
 *       onPressOut={() => animate(1)}
 *     >
 *       <Text>Press me</Text>
 *     </AnimatedView>
 *   )
 * }
 * ```
 */

import { useState, useCallback, useMemo } from 'react'
import type { ViewStyle } from 'react-native'
import { springConfigs, type SpringConfigKey } from './presets'
import { useReducedMotion } from './useReducedMotion'
import {
  isReanimatedLoaded,
  useSharedValueAsserted,
  useAnimatedStyleAsserted,
  withSpringAsserted,
  type SpringConfig,
} from './reanimated.types'

export interface UseAnimatedSpringOptions {
  /**
   * Initial value for the animation
   * @default 0
   */
  initialValue?: number

  /**
   * Spring configuration preset or custom config
   * @default 'default'
   */
  springConfig?: SpringConfigKey | SpringConfig

  /**
   * Which style property to animate
   * @default 'scale'
   */
  property?: 'scale' | 'opacity' | 'translateX' | 'translateY' | 'rotate'
}

export interface UseAnimatedSpringReturn {
  /**
   * Current animation value
   */
  value: number

  /**
   * Style object to apply to AnimatedView
   */
  animatedStyle: ViewStyle

  /**
   * Animate to a new value
   */
  animate: (toValue: number) => void

  /**
   * Whether Reanimated is being used
   */
  isAnimated: boolean
}

/**
 * Convert property and value to ViewStyle
 */
function createStyle(
  property: 'scale' | 'opacity' | 'translateX' | 'translateY' | 'rotate',
  value: number
): ViewStyle {
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
    default:
      return {}
  }
}

/**
 * Get spring config from preset or custom config
 */
function getSpringConfig(
  springConfig: SpringConfigKey | SpringConfig | undefined
): SpringConfig {
  if (!springConfig) {
    return springConfigs.default
  }
  if (typeof springConfig === 'string') {
    return springConfigs[springConfig]
  }
  return springConfig
}

/**
 * Reanimated-based spring implementation (only used when Reanimated is available)
 */
function useAnimatedSpringReanimated(
  options: UseAnimatedSpringOptions = {}
): UseAnimatedSpringReturn {
  const {
    initialValue = 0,
    springConfig,
    property = 'scale',
  } = options

  const prefersReducedMotion = useReducedMotion()
  const config = getSpringConfig(springConfig)

  // Use asserted versions since this function only runs when Reanimated is available
  const sharedValue = useSharedValueAsserted(initialValue)

  const animatedStyle = useAnimatedStyleAsserted(() => {
    'worklet'
    return createStyle(property, sharedValue.value)
  }, [property])

  const animate = useCallback(
    (toValue: number) => {
      if (prefersReducedMotion) {
        // Skip animation for reduced motion - instant transition
        sharedValue.value = toValue
      } else {
        sharedValue.value = withSpringAsserted(toValue, config)
      }
    },
    [sharedValue, config, prefersReducedMotion]
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
function useAnimatedSpringFallback(
  options: UseAnimatedSpringOptions = {}
): UseAnimatedSpringReturn {
  const {
    initialValue = 0,
    property = 'scale',
  } = options

  const [currentValue, setCurrentValue] = useState(initialValue)

  const animatedStyle = useMemo(
    () => createStyle(property, currentValue),
    [property, currentValue]
  )

  const animate = useCallback((toValue: number) => {
    setCurrentValue(toValue)
  }, [])

  return {
    value: currentValue,
    animatedStyle,
    animate,
    isAnimated: false,
  }
}

/**
 * Hook for spring-based animations with graceful fallback.
 * Uses Reanimated when available, instant state updates otherwise.
 */
export const useAnimatedSpring = isReanimatedLoaded
  ? useAnimatedSpringReanimated
  : useAnimatedSpringFallback
