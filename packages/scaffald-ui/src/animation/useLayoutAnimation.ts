/**
 * useLayoutAnimation hook
 * Returns a function to configure LayoutAnimation for the next layout update.
 * Respects useReducedMotion - skips animation when user prefers reduced motion.
 *
 * Use before state updates that cause layout changes (e.g. accordion expand/collapse,
 * list reorder, modal size changes).
 *
 * @example
 * ```tsx
 * const prepareLayoutAnimation = useLayoutAnimation()
 *
 * const handleExpand = () => {
 *   prepareLayoutAnimation()
 *   setExpanded(true)
 * }
 * ```
 */

import { useCallback } from 'react'
import { LayoutAnimation, Platform } from 'react-native'
import { useReducedMotion } from './useReducedMotion'

export interface LayoutAnimationConfig {
  duration?: number
  update?: {
    type?: 'spring' | 'linear' | 'easeInEaseOut' | 'easeIn' | 'easeOut'
    property?: 'opacity' | 'scaleX' | 'scaleY' | 'scaleXY'
  }
}

const DEFAULT_CONFIG: LayoutAnimationConfig = {
  duration: 200,
  update: {
    type: 'easeInEaseOut',
    property: 'opacity',
  },
}

/**
 * Configures LayoutAnimation for the next layout update.
 * No-op when prefersReducedMotion is true or on web (LayoutAnimation has limited web support).
 */
export function useLayoutAnimation(config: LayoutAnimationConfig = DEFAULT_CONFIG) {
  const prefersReducedMotion = useReducedMotion()

  return useCallback(() => {
    if (prefersReducedMotion || Platform.OS === 'web') return

    const duration = config.duration ?? DEFAULT_CONFIG.duration ?? 200
    const type = config.update?.type ?? DEFAULT_CONFIG.update?.type ?? 'easeInEaseOut'
    const property = config.update?.property ?? DEFAULT_CONFIG.update?.property ?? 'opacity'

    LayoutAnimation.configureNext({
      duration,
      update: { type, property },
      create: { type, property },
      delete: { type, property },
    })
  }, [prefersReducedMotion, config.duration, config.update?.type, config.update?.property])
}
