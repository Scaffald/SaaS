/**
 * Type definitions for React Native Reanimated
 *
 * These types allow us to use Reanimated as an optional dependency
 * without relying on `any` types throughout the codebase.
 */

import type { ViewStyle } from 'react-native'

/**
 * Reanimated shared value type
 */
export interface SharedValue<T> {
  value: T
}

/**
 * Spring animation configuration
 */
export interface SpringConfig {
  damping?: number
  stiffness?: number
  mass?: number
  overshootClamping?: boolean
  restDisplacementThreshold?: number
  restSpeedThreshold?: number
}

/**
 * Timing animation configuration
 */
export interface TimingConfig {
  duration?: number
  easing?: (t: number) => number
}

/**
 * Animation callback type
 */
export type AnimationCallback = (finished?: boolean) => void

/**
 * Worklet-compatible callback
 */
export type WorkletCallback = (finished?: boolean) => void

/**
 * useSharedValue hook type
 */
export type UseSharedValue = <T>(initialValue: T) => SharedValue<T>

/**
 * useAnimatedStyle hook type
 */
export type UseAnimatedStyle = <T extends ViewStyle>(
  updater: () => T,
  dependencies?: unknown[]
) => T

/**
 * withSpring function type
 */
export type WithSpring = <T extends number | string>(
  toValue: T,
  config?: SpringConfig,
  callback?: WorkletCallback
) => T

/**
 * withTiming function type
 */
export type WithTiming = <T extends number | string>(
  toValue: T,
  config?: TimingConfig,
  callback?: WorkletCallback
) => T

/**
 * Easing functions type
 */
export interface EasingFunctions {
  linear: (t: number) => number
  quad: (t: number) => number
  cubic: (t: number) => number
  in: (easing: (t: number) => number) => (t: number) => number
  out: (easing: (t: number) => number) => (t: number) => number
  inOut: (easing: (t: number) => number) => (t: number) => number
  bezier: (x1: number, y1: number, x2: number, y2: number) => (t: number) => number
}

/**
 * Reanimated module interface
 */
export interface ReanimatedModule {
  useSharedValue: UseSharedValue
  useAnimatedStyle: UseAnimatedStyle
  withSpring: WithSpring
  withTiming: WithTiming
  Easing: EasingFunctions
  default?: {
    View: React.ComponentType<unknown>
    createAnimatedComponent: <T>(component: T) => T
  }
}

/**
 * Try to load Reanimated and return typed functions or null
 */
function tryLoadReanimated(): ReanimatedModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Reanimated = require('react-native-reanimated') as ReanimatedModule
    return Reanimated
  } catch {
    return null
  }
}

// Load Reanimated once at module initialization
const reanimated = tryLoadReanimated()

/**
 * Whether Reanimated is available
 */
export const isReanimatedLoaded = reanimated !== null

/**
 * Reanimated hooks and functions (null if not available)
 */
export const useSharedValue: UseSharedValue | null = reanimated?.useSharedValue ?? null
export const useAnimatedStyle: UseAnimatedStyle | null = reanimated?.useAnimatedStyle ?? null
export const withSpring: WithSpring | null = reanimated?.withSpring ?? null
export const withTiming: WithTiming | null = reanimated?.withTiming ?? null
export const Easing: EasingFunctions | null = reanimated?.Easing ?? null

/**
 * Get Reanimated's Animated.View component
 */
export const ReanimatedView: React.ComponentType<unknown> | null =
  reanimated?.default?.View ?? null

/**
 * Create an animated component using Reanimated
 */
export function createAnimatedComponent<T>(component: T): T | null {
  if (reanimated?.default?.createAnimatedComponent) {
    return reanimated.default.createAnimatedComponent(component)
  }
  return null
}

/**
 * Asserted versions of Reanimated functions.
 * Use these in contexts where Reanimated is known to be available.
 * They throw at runtime if Reanimated is not loaded.
 */

function assertReanimated<T>(fn: T | null, name: string): T {
  if (fn === null) {
    throw new Error(`Reanimated not loaded: ${name} is unavailable`)
  }
  return fn
}

/**
 * Asserted useSharedValue - throws if Reanimated not loaded
 */
export function useSharedValueAsserted<T>(initialValue: T): SharedValue<T> {
  return assertReanimated(useSharedValue, 'useSharedValue')(initialValue)
}

/**
 * Asserted useAnimatedStyle - throws if Reanimated not loaded
 */
export function useAnimatedStyleAsserted<T extends ViewStyle>(
  updater: () => T,
  dependencies?: unknown[]
): T {
  return assertReanimated(useAnimatedStyle, 'useAnimatedStyle')(updater, dependencies)
}

/**
 * Asserted withSpring - throws if Reanimated not loaded
 */
export function withSpringAsserted<T extends number | string>(
  toValue: T,
  config?: SpringConfig,
  callback?: WorkletCallback
): T {
  return assertReanimated(withSpring, 'withSpring')(toValue, config, callback)
}

/**
 * Asserted withTiming - throws if Reanimated not loaded
 */
export function withTimingAsserted<T extends number | string>(
  toValue: T,
  config?: TimingConfig,
  callback?: WorkletCallback
): T {
  return assertReanimated(withTiming, 'withTiming')(toValue, config, callback)
}
