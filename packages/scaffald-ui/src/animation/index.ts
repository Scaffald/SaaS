/**
 * Animation module for Beyond UI
 *
 * Provides animation utilities that integrate with React Native Reanimated.
 * All utilities gracefully fallback if Reanimated is not installed, making
 * it safe to use in projects where animations are optional.
 *
 * @example
 * ```tsx
 * import {
 *   AnimatedView,
 *   AnimatedPressable,
 *   FadeTransition,
 *   useAnimatedSpring,
 *   springConfigs,
 * } from '@scaffald/ui'
 *
 * // Use AnimatedPressable for button with press animation
 * <AnimatedPressable onPress={handlePress} pressScale={0.95}>
 *   <Text>Press me</Text>
 * </AnimatedPressable>
 *
 * // Use FadeTransition for modal content
 * <FadeTransition visible={isVisible}>
 *   <ModalContent />
 * </FadeTransition>
 *
 * // Use hooks for custom animations
 * const { animatedStyle, animate } = useAnimatedSpring({
 *   initialValue: 1,
 *   springConfig: 'snappy',
 * })
 * ```
 */

// Core animated components
export { AnimatedView, isReanimatedAvailable, type AnimatedViewProps } from './AnimatedView'
export { AnimatedPressable, isAnimatedPressAvailable, type AnimatedPressableProps } from './AnimatedPressable'

// Animation hooks
export { useReducedMotion } from './useReducedMotion'
export {
  useAnimatedSpring,
  type UseAnimatedSpringOptions,
  type UseAnimatedSpringReturn,
} from './useAnimatedSpring'
export {
  useAnimatedTiming,
  type UseAnimatedTimingOptions,
  type UseAnimatedTimingReturn,
  type EasingType,
} from './useAnimatedTiming'

// Transition components
export {
  FadeTransition,
  SlideTransition,
  ScaleTransition,
  type FadeTransitionProps,
  type SlideTransitionProps,
  type ScaleTransitionProps,
  type SlideDirection,
  type SlideAnimationType,
} from './transitions'

// Animation presets and configs
export {
  springConfigs,
  timingConfigs,
  animationPresets,
  bezierCurves,
  type SpringConfigKey,
  type TimingConfigKey,
  type BezierCurveKey,
} from './presets'
