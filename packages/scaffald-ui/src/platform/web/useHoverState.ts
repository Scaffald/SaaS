/**
 * useHoverState hook
 * Web-specific hover state management with proper touch device handling
 *
 * @example
 * ```tsx
 * import { useHoverState } from '@scaffald/ui'
 *
 * function HoverableCard() {
 *   const { isHovered, hoverProps } = useHoverState()
 *
 *   return (
 *     <View
 *       {...hoverProps}
 *       style={[
 *         styles.card,
 *         isHovered && styles.cardHovered,
 *       ]}
 *     >
 *       Card content
 *     </View>
 *   )
 * }
 * ```
 */

import { useState, useCallback, useMemo } from 'react'
import { Platform } from '../Platform'

export interface HoverProps {
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  onPointerEnter?: () => void
  onPointerLeave?: () => void
}

export interface UseHoverStateOptions {
  /** Whether hover is disabled */
  disabled?: boolean
  /** Delay before hover state activates (ms) */
  delayEnter?: number
  /** Delay before hover state deactivates (ms) */
  delayLeave?: number
}

export interface UseHoverStateReturn {
  /** Whether the element is currently hovered */
  isHovered: boolean
  /** Props to spread on the hoverable element */
  hoverProps: HoverProps
}

/**
 * Hook for managing hover state on web
 */
export function useHoverState(options: UseHoverStateOptions = {}): UseHoverStateReturn {
  const { disabled = false, delayEnter = 0, delayLeave = 0 } = options
  const [isHovered, setIsHovered] = useState(false)

  const onEnter = useCallback(() => {
    if (disabled) return

    if (delayEnter > 0) {
      const timeout = setTimeout(() => setIsHovered(true), delayEnter)
      return () => clearTimeout(timeout)
    }
    setIsHovered(true)
  }, [disabled, delayEnter])

  const onLeave = useCallback(() => {
    if (disabled) return

    if (delayLeave > 0) {
      const timeout = setTimeout(() => setIsHovered(false), delayLeave)
      return () => clearTimeout(timeout)
    }
    setIsHovered(false)
  }, [disabled, delayLeave])

  const hoverProps = useMemo((): HoverProps => {
    // Only return props on web when not disabled
    if (!Platform.isWeb || disabled) {
      return {}
    }

    // Check if hover is supported
    if (!Platform.supportsHover()) {
      return {}
    }

    // Prefer pointer events over mouse events
    if (Platform.supportsPointer()) {
      return {
        onPointerEnter: onEnter,
        onPointerLeave: onLeave,
      }
    }

    return {
      onMouseEnter: onEnter,
      onMouseLeave: onLeave,
    }
  }, [disabled, onEnter, onLeave])

  return {
    isHovered: Platform.isWeb ? isHovered : false,
    hoverProps,
  }
}
