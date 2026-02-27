import { useState, useCallback } from 'react'
import { Platform } from 'react-native'
import type { TabsContextValue } from './Tabs.types'

export interface UseTabItemProps {
  /** Unique value for this tab */
  value: string
  /** Whether this tab is disabled */
  disabled?: boolean
  /** Tabs context from useTabs hook */
  context: TabsContextValue
}

/**
 * Headless hook for managing individual Tab Item state and logic.
 * Includes accessibility properties and interaction handlers.
 */
export function useTabItem({ value, disabled: disabledProp = false, context }: UseTabItemProps) {
  const [isHovered, setIsHovered] = useState(false)
  
  // Check if this item is selected
  const isSelected = context.value === value
  
  // Item is disabled if parent is disabled or if explicitly disabled
  const disabled = context.disabled || disabledProp

  const handlePress = useCallback(() => {
    if (disabled) return
    context.onValueChange(value)
  }, [disabled, context, value])

  return {
    // State
    isSelected,
    disabled,
    value,
    isHovered,
    
    // Actions
    setIsHovered,
    
    // Prop getters
    getTriggerProps: (onPressProp?: () => void) => ({
      disabled,
      onPress: () => {
        if (disabled) return
        if (onPressProp) {
          onPressProp()
        } else {
          handlePress()
        }
      },
      accessibilityRole: 'tab' as const,
      accessibilityState: {
        selected: isSelected,
        disabled,
      },
      ...(Platform.OS === 'web' && {
        onMouseEnter: () => setIsHovered(true),
        onMouseLeave: () => setIsHovered(false),
      }),
    }),
  }
}
