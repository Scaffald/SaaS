/**
 * AnimatedView component
 * A drop-in replacement for View that supports Reanimated animations
 *
 * This component gracefully degrades to a regular View if Reanimated
 * is not installed, making it safe to use without the optional dependency.
 *
 * @example
 * ```tsx
 * import { AnimatedView } from '@scaffald/ui'
 * import { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated'
 *
 * function MyComponent() {
 *   const scale = useSharedValue(1)
 *
 *   const animatedStyle = useAnimatedStyle(() => ({
 *     transform: [{ scale: scale.value }],
 *   }))
 *
 *   return (
 *     <AnimatedView style={animatedStyle}>
 *       <Text>Animated content</Text>
 *     </AnimatedView>
 *   )
 * }
 * ```
 */

import { forwardRef } from 'react'
import { View, type ViewProps } from 'react-native'
import { ReanimatedView as ReanimatedViewComponent, isReanimatedLoaded } from './reanimated.types'

export interface AnimatedViewProps extends ViewProps {
  /**
   * When true, forces use of regular View even if Reanimated is available.
   * Useful for conditional animation or performance optimization.
   */
  disableAnimation?: boolean
  /**
   * Optional Reanimated layout transition
   */
  layout?: any
  /**
   * Optional Reanimated entering animation
   */
  entering?: any
  /**
   * Optional Reanimated exiting animation
   */
  exiting?: any
}

/**
 * Animated View component that supports Reanimated animations.
 * Falls back to regular View if Reanimated is not installed.
 */
export const AnimatedView = forwardRef<View, AnimatedViewProps>(
  function AnimatedView({ disableAnimation = false, layout, entering, exiting, ...props }, ref) {
    // Use regular View if animation is disabled or Reanimated is not available
    if (disableAnimation || !isReanimatedLoaded || !ReanimatedViewComponent) {
      return <View ref={ref} {...props} />
    }

    // Use Reanimated's Animated.View
    // Cast is needed because Reanimated's View has slightly different props signature
    const AnimatedComponent = ReanimatedViewComponent as any
    return (
      <AnimatedComponent 
        ref={ref} 
        layout={layout} 
        entering={entering} 
        exiting={exiting} 
        {...props} 
      />
    )
  }
)

AnimatedView.displayName = 'AnimatedView'

/**
 * Check if Reanimated is available
 */
export function isReanimatedAvailable(): boolean {
  return isReanimatedLoaded
}
