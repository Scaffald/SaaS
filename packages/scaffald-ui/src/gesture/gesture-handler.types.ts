/**
 * Type definitions for React Native Gesture Handler
 *
 * Optional dependency - components fall back to PanResponder when not loaded.
 */

import type { ComponentType, ReactNode } from 'react'

/**
 * Pan gesture event with translation and position
 */
export interface PanGestureEvent {
  translationX: number
  translationY: number
  absoluteX?: number
  absoluteY?: number
  velocityX?: number
  velocityY?: number
  x?: number
  y?: number
}

/**
 * Gesture.Pan() builder interface (RNGH 2.x API)
 */
export interface PanGestureType {
  onStart: (callback: (event: PanGestureEvent) => void) => PanGestureType
  onUpdate: (callback: (event: PanGestureEvent) => void) => PanGestureType
  onEnd: (callback: (event: PanGestureEvent) => void) => PanGestureType
  onFinalize?: (callback: (event: PanGestureEvent) => void) => PanGestureType
  enabled: (enabled: boolean) => PanGestureType
  runOnJS: (runOnJS: boolean) => PanGestureType
  activeOffsetY?: (offset: number | number[]) => PanGestureType
}

/**
 * Gesture handler module interface
 */
export interface GestureHandlerModule {
  Gesture: {
    Pan: () => PanGestureType
  }
  GestureDetector: ComponentType<{
    gesture: PanGestureType
    children: ReactNode
  }>
}

function tryLoadGestureHandler(): GestureHandlerModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('react-native-gesture-handler') as GestureHandlerModule
  } catch {
    return null
  }
}

const gestureHandler = tryLoadGestureHandler()

/** Gesture API when RNGH is loaded; null otherwise */
export type GestureAPI = { Pan: () => PanGestureType }

export const isGestureHandlerLoaded = gestureHandler !== null
export const Gesture: GestureAPI | null = gestureHandler?.Gesture ?? null
export const GestureDetector = gestureHandler?.GestureDetector ?? null

/** Create a Pan gesture when RNGH is loaded. Returns null if unavailable. */
export function createPanGesture(): PanGestureType | null {
  if (!Gesture) return null
  return Gesture.Pan()
}
