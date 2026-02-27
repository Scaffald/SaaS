/**
 * Animation presets for React Native Reanimated
 *
 * These presets connect our design tokens to Reanimated-compatible configurations.
 * Import these when using withSpring, withTiming, or other Reanimated functions.
 *
 * @example
 * ```tsx
 * import { withSpring } from 'react-native-reanimated'
 * import { springConfigs, timingConfigs } from '@scaffald/ui/animation'
 *
 * // Use spring preset
 * scale.value = withSpring(1, springConfigs.snappy)
 *
 * // Use timing preset
 * opacity.value = withTiming(1, timingConfigs.normal)
 * ```
 */

import { duration, springs } from '../tokens/animations'

/**
 * Cubic bezier control points for Reanimated's Easing.bezier()
 * Extracted from the CSS cubic-bezier values in our tokens
 */
export const bezierCurves = {
  easeInQuad: [0.55, 0.085, 0.68, 0.53] as const,
  easeOutQuad: [0.25, 0.46, 0.45, 0.94] as const,
  easeInOutQuad: [0.455, 0.03, 0.515, 0.955] as const,
  easeInCubic: [0.55, 0.055, 0.675, 0.19] as const,
  easeOutCubic: [0.215, 0.61, 0.355, 1] as const,
  easeInOutCubic: [0.645, 0.045, 0.355, 1] as const,
  spring: [0.68, -0.55, 0.265, 1.55] as const,
  bounce: [0.68, -0.55, 0.265, 1.55] as const,
} as const

/**
 * Spring configurations for Reanimated's withSpring()
 * Maps directly to our design token spring values
 */
export const springConfigs = {
  /** Gentle spring - smooth and subtle */
  gentle: {
    damping: springs.gentle.damping,
    stiffness: springs.gentle.stiffness,
    mass: springs.gentle.mass,
  },
  /** Bouncy spring - playful with overshoot */
  bouncy: {
    damping: springs.bouncy.damping,
    stiffness: springs.bouncy.stiffness,
    mass: springs.bouncy.mass,
  },
  /** Snappy spring - quick and responsive */
  snappy: {
    damping: springs.snappy.damping,
    stiffness: springs.snappy.stiffness,
    mass: springs.snappy.mass,
  },
  /** Wobbly spring - loose and wavy */
  wobbly: {
    damping: springs.wobbly.damping,
    stiffness: springs.wobbly.stiffness,
    mass: springs.wobbly.mass,
  },
  /** Default spring for general use */
  default: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },
  /** Press feedback spring - subtle scale on press */
  press: {
    damping: 20,
    stiffness: 400,
    mass: 0.8,
  },
} as const

/**
 * Timing configurations for Reanimated's withTiming()
 * Combines duration and easing from our tokens
 *
 * Note: The easing values here are string identifiers.
 * When using with Reanimated, map these to Easing functions:
 *
 * @example
 * ```tsx
 * import { Easing, withTiming } from 'react-native-reanimated'
 *
 * // For 'easeOut', use:
 * withTiming(1, { duration: 200, easing: Easing.out(Easing.quad) })
 * ```
 */
export const timingConfigs = {
  /** Instant - no animation */
  instant: {
    duration: duration.instant,
  },
  /** Fastest - micro-interactions */
  fastest: {
    duration: duration.fastest,
  },
  /** Fast - quick feedback */
  fast: {
    duration: duration.fast,
  },
  /** Normal - standard animations */
  normal: {
    duration: duration.normal,
  },
  /** Slow - emphasized transitions */
  slow: {
    duration: duration.slow,
  },
  /** Slowest - dramatic animations */
  slowest: {
    duration: duration.slowest,
  },
} as const

/**
 * Animation preset values for common use cases
 */
export const animationPresets = {
  /** Button press scale animation */
  pressScale: {
    pressed: 0.95,
    default: 1,
    spring: springConfigs.press,
  },
  /** Fade in/out */
  fade: {
    visible: 1,
    hidden: 0,
    timing: timingConfigs.normal,
  },
  /** Modal scale animation */
  modalScale: {
    visible: 1,
    hidden: 0.9,
    spring: springConfigs.snappy,
  },
  /** Slide distances */
  slideDistance: {
    small: 20,
    medium: 50,
    large: 100,
    full: '100%',
  },
  /** Toggle thumb translation */
  toggle: {
    sm: { on: 18, off: 2 },
    md: { on: 24, off: 2 },
  },
  /** Checkbox check animation */
  checkbox: {
    checked: { scale: 1, opacity: 1 },
    unchecked: { scale: 0.8, opacity: 0 },
    spring: springConfigs.snappy,
  },
  /** Accordion height animation */
  accordion: {
    timing: timingConfigs.normal,
  },
} as const

export type SpringConfigKey = keyof typeof springConfigs
export type TimingConfigKey = keyof typeof timingConfigs
export type BezierCurveKey = keyof typeof bezierCurves
