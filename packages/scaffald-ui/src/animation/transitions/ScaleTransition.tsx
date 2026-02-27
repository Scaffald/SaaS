/**
 * ScaleTransition component
 * Provides scale in/out animations for content
 *
 * @example
 * ```tsx
 * import { ScaleTransition } from '@scaffald/ui'
 *
 * function Modal({ visible }) {
 *   return (
 *     <ScaleTransition visible={visible} fromScale={0.9}>
 *       <View style={styles.modal}>
 *         <Text>Modal content</Text>
 *       </View>
 *     </ScaleTransition>
 *   )
 * }
 * ```
 */

import { forwardRef, useState, useEffect } from 'react'
import { View, type ViewProps, type ViewStyle } from 'react-native'
import { AnimatedView } from '../AnimatedView'
import { springConfigs, type SpringConfigKey } from '../presets'
import { useReducedMotion } from '../useReducedMotion'
import {
  isReanimatedLoaded,
  useSharedValueAsserted,
  useAnimatedStyleAsserted,
  withSpringAsserted,
} from '../reanimated.types'

export interface ScaleTransitionProps extends Omit<ViewProps, 'style'> {
  /**
   * Whether the content is visible
   */
  visible: boolean

  /**
   * Scale value when hidden
   * @default 0.9
   */
  fromScale?: number

  /**
   * Scale value when visible
   * @default 1
   */
  toScale?: number

  /**
   * Spring config preset
   * @default 'snappy'
   */
  springConfig?: SpringConfigKey

  /**
   * Whether to include fade with scale
   * @default true
   */
  withFade?: boolean

  /**
   * Whether to unmount content when not visible
   * @default true
   */
  unmountOnHide?: boolean

  /**
   * Callback when scale in animation completes
   */
  onScaleInComplete?: () => void

  /**
   * Callback when scale out animation completes
   */
  onScaleOutComplete?: () => void

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
 * Scale transition component with mount/unmount support
 */
export const ScaleTransition = forwardRef<View, ScaleTransitionProps>(
  function ScaleTransition(
    {
      visible,
      fromScale = 0.9,
      toScale = 1,
      springConfig = 'snappy',
      withFade = true,
      unmountOnHide = true,
      onScaleInComplete,
      onScaleOutComplete,
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
        <ReanimatedScale
          ref={ref}
          visible={visible}
          fromScale={fromScale}
          toScale={toScale}
          springConfig={springConfig}
          withFade={withFade}
          unmountOnHide={unmountOnHide}
          onScaleInComplete={onScaleInComplete}
          onScaleOutComplete={onScaleOutComplete}
          style={style}
          {...props}
        >
          {children}
        </ReanimatedScale>
      )
    }

    // Fallback: instant show/hide
    if (!visible && unmountOnHide) {
      return null
    }

    return (
      <View
        ref={ref}
        style={[
          style,
          {
            opacity: visible ? 1 : 0,
            transform: [{ scale: visible ? toScale : fromScale }],
          },
        ]}
        {...props}
      >
        {children}
      </View>
    )
  }
)

ScaleTransition.displayName = 'ScaleTransition'

/**
 * Internal Reanimated-powered scale component
 */
function ReanimatedScale({
  ref,
  visible,
  fromScale,
  toScale,
  springConfig,
  withFade,
  unmountOnHide,
  onScaleInComplete,
  onScaleOutComplete,
  style,
  children,
  ...props
}: ScaleTransitionProps & { ref: React.Ref<View> }) {
  const [shouldRender, setShouldRender] = useState(visible)

  // Use concrete values (props have defaults at component level)
  const fromScaleValue = fromScale ?? 0.9
  const toScaleValue = toScale ?? 1

  // Use asserted versions since this component only renders when Reanimated is available
  const scale = useSharedValueAsserted(visible ? toScaleValue : fromScaleValue)
  const opacity = useSharedValueAsserted(visible ? 1 : 0)
  const spring = springConfigs[springConfig || 'snappy']

  const animatedStyle = useAnimatedStyleAsserted(() => {
    'worklet'
    return {
      transform: [{ scale: scale.value }],
      opacity: withFade ? opacity.value : 1,
    }
  })

  useEffect(() => {
    if (visible) {
      setShouldRender(true)
      requestAnimationFrame(() => {
        scale.value = withSpringAsserted(toScaleValue, spring, (finished) => {
          'worklet'
          if (finished && onScaleInComplete) {
            onScaleInComplete()
          }
        })
        if (withFade) {
          opacity.value = withSpringAsserted(1, spring)
        }
      })
    } else {
      scale.value = withSpringAsserted(fromScaleValue, spring, (finished) => {
        'worklet'
        if (finished) {
          if (unmountOnHide) {
            setShouldRender(false)
          }
          if (onScaleOutComplete) {
            onScaleOutComplete()
          }
        }
      })
      if (withFade) {
        opacity.value = withSpringAsserted(0, spring)
      }
    }
  }, [visible, toScaleValue, fromScaleValue, spring, withFade, onScaleInComplete, onScaleOutComplete, unmountOnHide, scale, opacity])

  if (!shouldRender && unmountOnHide) {
    return null
  }

  return (
    <AnimatedView ref={ref} style={[style, animatedStyle]} {...props}>
      {children}
    </AnimatedView>
  )
}
