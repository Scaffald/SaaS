/**
 * FadeTransition component
 * Provides fade in/out animations for mounting/unmounting content
 *
 * @example
 * ```tsx
 * import { FadeTransition } from '@scaffald/ui'
 *
 * function TooltipContent({ visible }) {
 *   return (
 *     <FadeTransition visible={visible} duration="fast">
 *       <View style={styles.tooltip}>
 *         <Text>Tooltip content</Text>
 *       </View>
 *     </FadeTransition>
 *   )
 * }
 * ```
 */

import { forwardRef, useState, useEffect } from 'react'
import { View, type ViewProps, type ViewStyle } from 'react-native'
import { AnimatedView } from '../AnimatedView'
import { useAnimatedTiming, type EasingType } from '../useAnimatedTiming'
import type { TimingConfigKey } from '../presets'
import { useReducedMotion } from '../useReducedMotion'

export interface FadeTransitionProps extends Omit<ViewProps, 'style'> {
  /**
   * Whether the content is visible
   */
  visible: boolean

  /**
   * Duration of the fade animation
   * @default 'normal'
   */
  duration?: TimingConfigKey | number

  /**
   * Easing function for the animation
   * @default 'easeOut'
   */
  easing?: EasingType

  /**
   * Whether to unmount content when not visible
   * @default true
   */
  unmountOnHide?: boolean

  /**
   * Callback when fade in animation completes
   */
  onFadeInComplete?: () => void

  /**
   * Callback when fade out animation completes
   */
  onFadeOutComplete?: () => void

  /**
   * Style for the container
   */
  style?: ViewStyle

  /**
   * Children to render
   */
  children: React.ReactNode
}

/**
 * Fade transition component with mount/unmount support
 */
export const FadeTransition = forwardRef<View, FadeTransitionProps>(
  function FadeTransition(
    {
      visible,
      duration = 'normal',
      easing = 'easeOut',
      unmountOnHide = true,
      onFadeInComplete,
      onFadeOutComplete,
      style,
      children,
      ...props
    },
    ref
  ) {
    const prefersReducedMotion = useReducedMotion()
    const [shouldRender, setShouldRender] = useState(visible)

    const { animatedStyle, animate, isAnimated } = useAnimatedTiming({
      initialValue: visible ? 1 : 0,
      duration: prefersReducedMotion ? 0 : duration,
      easing,
      property: 'opacity',
    })

    // Handle visibility changes
    useEffect(() => {
      if (visible) {
        // Show immediately, then animate in
        setShouldRender(true)
        // Small delay to ensure component is mounted before animating
        requestAnimationFrame(() => {
          animate(1, onFadeInComplete)
        })
      } else {
        // Animate out, then hide
        animate(0, () => {
          if (unmountOnHide) {
            setShouldRender(false)
          }
          onFadeOutComplete?.()
        })
      }
    }, [visible, animate, unmountOnHide, onFadeInComplete, onFadeOutComplete])

    // Don't render if hidden and unmountOnHide is true
    if (!shouldRender && unmountOnHide) {
      return null
    }

    // If reduced motion or no animation available, just show/hide
    if (prefersReducedMotion || !isAnimated) {
      if (!visible && unmountOnHide) {
        return null
      }
      return (
        <View ref={ref} style={[style, { opacity: visible ? 1 : 0 }]} {...props}>
          {children}
        </View>
      )
    }

    return (
      <AnimatedView ref={ref} style={[style, animatedStyle]} {...props}>
        {children}
      </AnimatedView>
    )
  }
)

FadeTransition.displayName = 'FadeTransition'
