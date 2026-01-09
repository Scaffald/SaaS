/**
 * useInteractiveState hook
 * Manages hover and focus states with platform-specific handling
 *
 * This hook consolidates hover/focus state management patterns that were
 * duplicated across 10+ components (Button, Checkbox, Radio, Toggle,
 * SelectionCard, Chip, Pagination, Input, Dropdown, Accordion).
 *
 * Automatically handles Platform.OS checks and provides web-only event handlers.
 *
 * @example
 * ```tsx
 * function Button({ disabled }) {
 *   const { isHovered, isFocused, interactiveProps } = useInteractiveState(disabled)
 *
 *   return (
 *     <Pressable
 *       {...interactiveProps}
 *       style={[
 *         styles.button,
 *         isHovered && styles.hovered,
 *         isFocused && styles.focused,
 *       ]}
 *     >
 *       Button Text
 *     </Pressable>
 *   )
 * }
 * ```
 */

import { useState, useMemo } from 'react'
import { Platform } from 'react-native'

export interface InteractiveState {
  /** Whether the element is currently hovered (web only) */
  isHovered: boolean
  /** Whether the element is currently focused (web only) */
  isFocused: boolean
  /** Props to spread on the interactive element */
  interactiveProps: {
    onMouseEnter?: () => void
    onMouseLeave?: () => void
    onFocus?: () => void
    onBlur?: () => void
  }
}

/**
 * Manages interactive states (hover, focus) with platform-specific handling
 *
 * @param disabled - Whether the element is disabled (disables interactions)
 * @returns Interactive state and props
 */
export function useInteractiveState(disabled: boolean = false): InteractiveState {
  const [isHovered, setIsHovered] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  const interactiveProps = useMemo(() => {
    // Only add event handlers on web when not disabled
    if (Platform.OS !== 'web' || disabled) {
      return {}
    }

    return {
      onMouseEnter: () => setIsHovered(true),
      onMouseLeave: () => setIsHovered(false),
      onFocus: () => setIsFocused(true),
      onBlur: () => setIsFocused(false),
    }
  }, [disabled])

  return {
    // Only return true states on web, always false on native
    isHovered: Platform.OS === 'web' ? isHovered : false,
    isFocused: Platform.OS === 'web' ? isFocused : false,
    interactiveProps,
  }
}
