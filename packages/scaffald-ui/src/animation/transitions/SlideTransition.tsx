/**
 * SlideTransition component
 * Provides slide in/out animations from different directions
 *
 * @example
 * ```tsx
 * import { SlideTransition } from '@scaffald/ui'
 *
 * function BottomSheet({ visible }) {
 *   return (
 *     <SlideTransition
 *       visible={visible}
 *       direction="up"
 *       distance={300}
 *     >
 *       <View style={styles.sheet}>
 *         <Text>Sheet content</Text>
 *       </View>
 *     </SlideTransition>
 *   )
 * }
 * ```
 */

import { forwardRef, useState, useEffect } from 'react'
import { View, type ViewProps, type ViewStyle } from 'react-native'
import { AnimatedView } from '../AnimatedView'
import { type TimingConfigKey, timingConfigs, springConfigs, type SpringConfigKey } from '../presets'
import { useReducedMotion } from '../useReducedMotion'
import {
  isReanimatedLoaded,
  useSharedValueAsserted,
  useAnimatedStyleAsserted,
  withSpringAsserted,
  withTimingAsserted,
} from '../reanimated.types'

export type SlideDirection = 'up' | 'down' | 'left' | 'right'
export type SlideAnimationType = 'spring' | 'timing'

export interface SlideTransitionProps extends Omit<ViewProps, 'style'> {
  /**
   * Whether the content is visible
   */
  visible: boolean

  /**
   * Direction to slide from
   * @default 'up'
   */
  direction?: SlideDirection

  /**
   * Distance to slide in pixels
   * @default 100
   */
  distance?: number

  /**
   * Animation type - spring for bouncy, timing for linear
   * @default 'spring'
   */
  animationType?: SlideAnimationType

  /**
   * Spring config preset (when animationType is 'spring')
   * @default 'snappy'
   */
  springConfig?: SpringConfigKey

  /**
   * Duration preset (when animationType is 'timing')
   * @default 'normal'
   */
  duration?: TimingConfigKey | number

  /**
   * Whether to include fade with slide
   * @default true
   */
  withFade?: boolean

  /**
   * Whether to unmount content when not visible
   * @default true
   */
  unmountOnHide?: boolean

  /**
   * Callback when slide in animation completes
   */
  onSlideInComplete?: () => void

  /**
   * Callback when slide out animation completes
   */
  onSlideOutComplete?: () => void

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
 * Slide transition component with mount/unmount support
 */
export const SlideTransition = forwardRef<View, SlideTransitionProps>(
  function SlideTransition(
    {
      visible,
      direction = 'up',
      distance = 100,
      animationType = 'spring',
      springConfig = 'snappy',
      duration = 'normal',
      withFade = true,
      unmountOnHide = true,
      onSlideInComplete,
      onSlideOutComplete,
      style,
      children,
      ...props
    },
    ref
  ) {
    const prefersReducedMotion = useReducedMotion()
    const canAnimate = isReanimatedLoaded && !prefersReducedMotion

    if (canAnimate) {
      return (
        <ReanimatedSlide
          ref={ref}
          visible={visible}
          direction={direction}
          distance={distance}
          animationType={animationType}
          springConfig={springConfig}
          duration={duration}
          withFade={withFade}
          unmountOnHide={unmountOnHide}
          onSlideInComplete={onSlideInComplete}
          onSlideOutComplete={onSlideOutComplete}
          style={style}
          {...props}
        >
          {children}
        </ReanimatedSlide>
      )
    }

    // Fallback: instant show/hide
    if (!visible && unmountOnHide) {
      return null
    }

    return (
      <View
        ref={ref}
        style={[style, { opacity: visible ? 1 : 0 }]}
        {...props}
      >
        {children}
      </View>
    )
  }
)

SlideTransition.displayName = 'SlideTransition'

/**
 * Internal Reanimated-powered slide component
 */
function ReanimatedSlide({
  ref,
  visible,
  direction = 'up',
  distance = 100,
  animationType = 'spring',
  springConfig = 'snappy',
  duration = 'normal',
  withFade = true,
  unmountOnHide = true,
  onSlideInComplete,
  onSlideOutComplete,
  style,
  children,
  ...props
}: SlideTransitionProps & { ref: React.Ref<View> }) {
  const [shouldRender, setShouldRender] = useState(visible)

  // Get translation direction
  const isVertical = direction === 'up' || direction === 'down'
  const isPositive = direction === 'up' || direction === 'left'
  const startValue = isPositive ? distance : -distance

  // Use asserted versions since this component only renders when Reanimated is available
  const translate = useSharedValueAsserted(visible ? 0 : startValue)
  const opacity = useSharedValueAsserted(visible ? 1 : 0)

  // Get animation config
  const spring = springConfigs[springConfig || 'snappy']
  const durationMs = typeof duration === 'number' ? duration : (timingConfigs[duration || 'normal']?.duration ?? 300)

  // Animated style
  const animatedStyle = useAnimatedStyleAsserted(() => {
    'worklet'
    const transform = isVertical
      ? [{ translateY: translate.value }]
      : [{ translateX: translate.value }]

    return {
      transform,
      opacity: withFade ? opacity.value : 1,
    }
  })

  // Handle visibility changes
  useEffect(() => {
    if (visible) {
      setShouldRender(true)
      // Small delay to ensure component is mounted
      requestAnimationFrame(() => {
        if (animationType === 'spring') {
          translate.value = withSpringAsserted(0, spring, (finished) => {
            'worklet'
            if (finished && onSlideInComplete) {
              onSlideInComplete()
            }
          })
        } else {
          translate.value = withTimingAsserted(0, { duration: durationMs }, (finished) => {
            'worklet'
            if (finished && onSlideInComplete) {
              onSlideInComplete()
            }
          })
        }
        if (withFade) {
          opacity.value = animationType === 'spring'
            ? withSpringAsserted(1, spring)
            : withTimingAsserted(1, { duration: durationMs })
        }
      })
    } else {
      const onComplete = (finished?: boolean) => {
        'worklet'
        if (finished) {
          if (unmountOnHide) {
            setShouldRender(false)
          }
          if (onSlideOutComplete) {
            onSlideOutComplete()
          }
        }
      }

      if (animationType === 'spring') {
        translate.value = withSpringAsserted(startValue, spring, onComplete)
      } else {
        translate.value = withTimingAsserted(startValue, { duration: durationMs }, onComplete)
      }
      if (withFade) {
        opacity.value = animationType === 'spring'
          ? withSpringAsserted(0, spring)
          : withTimingAsserted(0, { duration: durationMs })
      }
    }
  }, [visible, animationType, spring, durationMs, startValue, withFade, onSlideInComplete, onSlideOutComplete, unmountOnHide, translate, opacity])

  if (!shouldRender && unmountOnHide) {
    return null
  }

  return (
    <AnimatedView ref={ref} style={[style, animatedStyle]} {...props}>
      {children}
    </AnimatedView>
  )
}
