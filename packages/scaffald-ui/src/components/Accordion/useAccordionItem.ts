import { useState, useCallback } from 'react'
import type { AccordionContextValue } from './Accordion.types'
import { Platform } from 'react-native'

export interface UseAccordionItemProps {
  /** Unique value for this item */
  value: string
  /** Whether this item is disabled */
  disabled?: boolean
  /** Accordion context from useAccordion hook */
  context: AccordionContextValue
}

/**
 * Headless hook for managing individual Accordion Item state and logic.
 * Includes accessibility properties and interaction handlers.
 */
export function useAccordionItem({
  value,
  disabled: disabledProp = false,
  context,
}: UseAccordionItemProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  // Check if this item is expanded
  const isExpanded = Array.isArray(context.value)
    ? context.value.includes(value)
    : context.value === value

  // Item is disabled if parent is disabled or if explicitly disabled
  const disabled = context.disabled || disabledProp

  const toggle = useCallback(() => {
    if (disabled) return
    context.onValueChange(value)
  }, [disabled, context, value])

  return {
    // State
    isExpanded,
    disabled,
    value,
    isFocused,
    isHovered,

    // Actions
    setIsFocused,
    setIsHovered,
    toggle,

    // Prop getters for accessibility and interaction
    getRootProps: () => ({
      onFocus: () => setIsFocused(true),
      onBlur: () => setIsFocused(false),
    }),
    
    getTriggerProps: () => ({
      onPress: toggle,
      disabled,
      accessibilityRole: 'button' as const,
      accessibilityState: {
        expanded: isExpanded,
        disabled,
      },
      ...(Platform.OS === 'web' && {
        onMouseEnter: () => setIsHovered(true),
        onMouseLeave: () => setIsHovered(false),
      }),
    }),
  }
}
