/**
 * AnimatedPressable component
 * A Pressable with built-in press animation using Reanimated
 *
 * Provides smooth scale animation on press by default, with customizable
 * spring configuration. Falls back to regular Pressable opacity behavior
 * if Reanimated is not installed.
 *
 * @example
 * ```tsx
 * import { AnimatedPressable } from '@scaffald/ui'
 *
 * // Basic usage with default scale animation
 * <AnimatedPressable onPress={handlePress}>
 *   <Text>Press me</Text>
 * </AnimatedPressable>
 *
 * // Custom scale value
 * <AnimatedPressable pressScale={0.9} onPress={handlePress}>
 *   <Text>Press me harder</Text>
 * </AnimatedPressable>
 *
 * // Disable animation
 * <AnimatedPressable animateOnPress={false} onPress={handlePress}>
 *   <Text>No animation</Text>
 * </AnimatedPressable>
 * ```
 */

import { forwardRef, useState, useCallback, useMemo } from 'react'
import { Pressable } from 'react-native'
import type { PressableProps, ViewStyle, GestureResponderEvent, View } from 'react-native'
import { useReducedMotion } from './useReducedMotion'
import { springConfigs } from './presets'
import {
  createAnimatedComponent,
  isReanimatedLoaded,
  useSharedValueAsserted,
  useAnimatedStyleAsserted,
  withSpringAsserted,
} from './reanimated.types'

// Create animated Pressable component if Reanimated is available
const AnimatedPressableBase = isReanimatedLoaded ? createAnimatedComponent(Pressable) : null

export interface AnimatedPressableProps extends Omit<PressableProps, 'style'> {
  /**
   * Whether to animate on press
   * @default true
   */
  animateOnPress?: boolean

  /**
   * Scale value when pressed (0-1)
   * @default 0.95
   */
  pressScale?: number

  /**
   * Spring configuration preset
   * @default 'press'
   */
  springConfig?: keyof typeof springConfigs

  /**
   * Style for the pressable container
   */
  style?: ViewStyle | ViewStyle[] | ((state: { pressed: boolean }) => ViewStyle | ViewStyle[])

  /**
   * Children to render inside the pressable
   */
  children?: React.ReactNode
}

/**
 * Animated Pressable with built-in scale animation on press.
 * Falls back to opacity-based feedback if Reanimated is not available.
 */
export const AnimatedPressable = forwardRef<View, AnimatedPressableProps>(
  function AnimatedPressable(
    {
      animateOnPress = true,
      pressScale = 0.95,
      springConfig = 'press',
      style,
      disabled,
      onPressIn,
      onPressOut,
      children,
      ...props
    },
    ref
  ) {
    const prefersReducedMotion = useReducedMotion()
    const shouldAnimate = animateOnPress && !prefersReducedMotion && !disabled
    const canAnimate = isReanimatedLoaded && AnimatedPressableBase

    if (canAnimate && shouldAnimate) {
      return (
        <ReanimatedPressable
          ref={ref}
          pressScale={pressScale}
          springConfig={springConfig}
          style={style}
          disabled={disabled}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          {...props}
        >
          {children}
        </ReanimatedPressable>
      )
    }

    // Fallback to regular Pressable with opacity feedback
    return (
      <FallbackPressable
        ref={ref}
        style={style}
        disabled={disabled}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        {...props}
      >
        {children}
      </FallbackPressable>
    )
  }
)

AnimatedPressable.displayName = 'AnimatedPressable'

/**
 * Internal component using Reanimated for smooth animations
 */
function ReanimatedPressable({
  ref,
  pressScale,
  springConfig,
  style,
  disabled,
  onPressIn,
  onPressOut,
  children,
  ...props
}: AnimatedPressableProps & { ref: React.Ref<View> }) {
  // Use asserted versions since this component only renders when Reanimated is available
  const scale = useSharedValueAsserted(1)
  const config = springConfigs[springConfig || 'press']

  const animatedStyle = useAnimatedStyleAsserted(() => {
    'worklet'
    return {
      transform: [{ scale: scale.value }],
    }
  })

  const pressScaleValue = pressScale ?? 0.95

  const handlePressIn = useCallback(
    (event: GestureResponderEvent) => {
      scale.value = withSpringAsserted(pressScaleValue, config)
      onPressIn?.(event)
    },
    [scale, pressScaleValue, config, onPressIn]
  )

  const handlePressOut = useCallback(
    (event: GestureResponderEvent) => {
      scale.value = withSpringAsserted(1, config)
      onPressOut?.(event)
    },
    [scale, config, onPressOut]
  )

  const combinedStyle = useMemo(() => {
    if (typeof style === 'function') {
      return (state: { pressed: boolean }) => [style(state), animatedStyle]
    }
    return [style, animatedStyle]
  }, [style, animatedStyle])

  // Cast to Pressable type since we know AnimatedPressableBase is available here
  const AnimatedComponent = AnimatedPressableBase as typeof Pressable

  return (
    <AnimatedComponent
      ref={ref}
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={combinedStyle}
      {...props}
    >
      {children}
    </AnimatedComponent>
  )
}

/**
 * Fallback Pressable using built-in opacity feedback
 */
const FallbackPressable = forwardRef<
  View,
  Omit<AnimatedPressableProps, 'animateOnPress' | 'pressScale' | 'springConfig'>
>(function FallbackPressable({ style, disabled, children, onPressIn, onPressOut, ...props }, ref) {
  const [isPressed, setIsPressed] = useState(false)

  const handlePressIn = useCallback(
    (event: GestureResponderEvent) => {
      setIsPressed(true)
      onPressIn?.(event)
    },
    [onPressIn]
  )

  const handlePressOut = useCallback(
    (event: GestureResponderEvent) => {
      setIsPressed(false)
      onPressOut?.(event)
    },
    [onPressOut]
  )

  const combinedStyle = useMemo(() => {
    const baseStyle = typeof style === 'function' ? style({ pressed: isPressed }) : style
    const pressedStyle = isPressed && !disabled ? { opacity: 0.8 } : {}
    return [baseStyle, pressedStyle]
  }, [style, isPressed, disabled])

  return (
    <Pressable
      ref={ref}
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={combinedStyle}
      {...props}
    >
      {children}
    </Pressable>
  )
})

/**
 * Check if animated press is available (Reanimated installed)
 */
export function isAnimatedPressAvailable(): boolean {
  return isReanimatedLoaded && AnimatedPressableBase !== null
}
