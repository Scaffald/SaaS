/**
 * Animation tokens for motion and transitions
 *
 * Provides timing, easing, and duration values for consistent animations
 */

/**
 * Animation duration in milliseconds
 */
export const duration = {
  instant: 0,
  fastest: 100,
  faster: 150,
  fast: 200,
  normal: 300,
  slow: 400,
  slower: 500,
  slowest: 700,
} as const

/**
 * Easing curves for natural motion
 * Compatible with both web (CSS transitions) and React Native (Animated)
 */
export const easing = {
  // Standard easings
  linear: 'linear',
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',

  // Custom cubic-bezier curves
  easeInQuad: 'cubic-bezier(0.55, 0.085, 0.68, 0.53)',
  easeOutQuad: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  easeInOutQuad: 'cubic-bezier(0.455, 0.03, 0.515, 0.955)',

  easeInCubic: 'cubic-bezier(0.55, 0.055, 0.675, 0.19)',
  easeOutCubic: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
  easeInOutCubic: 'cubic-bezier(0.645, 0.045, 0.355, 1)',

  // Spring-like easing
  spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
} as const

/**
 * Common transition presets
 */
export const transitions = {
  // Quick interactions
  quick: {
    duration: duration.faster,
    easing: easing.easeOut,
  },

  // Standard interactions
  normal: {
    duration: duration.normal,
    easing: easing.easeInOut,
  },

  // Slow, emphasized transitions
  slow: {
    duration: duration.slow,
    easing: easing.easeInOut,
  },

  // Bouncy, playful animations
  bouncy: {
    duration: duration.normal,
    easing: easing.spring,
  },

  // Smooth fade
  fade: {
    duration: duration.normal,
    easing: easing.easeInOut,
  },

  // Slide in/out
  slide: {
    duration: duration.fast,
    easing: easing.easeOut,
  },

  // Scale animations
  scale: {
    duration: duration.faster,
    easing: easing.easeOut,
  },
} as const

/**
 * Delay values for staggered animations
 */
export const delay = {
  none: 0,
  short: 50,
  medium: 100,
  long: 200,
  extraLong: 400,
} as const

/**
 * Animation presets for common use cases
 */
export const animations = {
  // Fade animations
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1 },
    ...transitions.fade,
  },
  fadeOut: {
    from: { opacity: 1 },
    to: { opacity: 0 },
    ...transitions.fade,
  },

  // Slide animations
  slideInUp: {
    from: { transform: [{ translateY: 20 }], opacity: 0 },
    to: { transform: [{ translateY: 0 }], opacity: 1 },
    ...transitions.slide,
  },
  slideInDown: {
    from: { transform: [{ translateY: -20 }], opacity: 0 },
    to: { transform: [{ translateY: 0 }], opacity: 1 },
    ...transitions.slide,
  },
  slideInLeft: {
    from: { transform: [{ translateX: -20 }], opacity: 0 },
    to: { transform: [{ translateX: 0 }], opacity: 1 },
    ...transitions.slide,
  },
  slideInRight: {
    from: { transform: [{ translateX: 20 }], opacity: 0 },
    to: { transform: [{ translateX: 0 }], opacity: 1 },
    ...transitions.slide,
  },

  // Scale animations
  scaleIn: {
    from: { transform: [{ scale: 0.9 }], opacity: 0 },
    to: { transform: [{ scale: 1 }], opacity: 1 },
    ...transitions.scale,
  },
  scaleOut: {
    from: { transform: [{ scale: 1 }], opacity: 1 },
    to: { transform: [{ scale: 0.9 }], opacity: 0 },
    ...transitions.scale,
  },

  // Bounce
  bounce: {
    from: { transform: [{ scale: 0.8 }] },
    to: { transform: [{ scale: 1 }] },
    ...transitions.bouncy,
  },

  // Spin
  spin: {
    from: { transform: [{ rotate: '0deg' }] },
    to: { transform: [{ rotate: '360deg' }] },
    duration: duration.slowest,
    easing: easing.linear,
  },
} as const

/**
 * Spring configuration for React Native Animated.spring
 */
export const springs = {
  gentle: {
    damping: 20,
    stiffness: 200,
    mass: 1,
  },
  bouncy: {
    damping: 10,
    stiffness: 300,
    mass: 1,
  },
  snappy: {
    damping: 25,
    stiffness: 400,
    mass: 0.8,
  },
  wobbly: {
    damping: 8,
    stiffness: 180,
    mass: 1.2,
  },
} as const

export type DurationToken = keyof typeof duration
export type EasingToken = keyof typeof easing
export type TransitionToken = keyof typeof transitions
export type DelayToken = keyof typeof delay
export type AnimationToken = keyof typeof animations
export type SpringToken = keyof typeof springs
