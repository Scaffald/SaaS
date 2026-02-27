import { useState, useCallback } from 'react'
import type { TabType, TabColor, TabSize, TabOrientation, TabContentVariant } from './Tabs.types'

export interface UseTabsProps {
  /** Current active tab value (controlled mode) */
  value?: string
  /** Default active tab value (uncontrolled mode) */
  defaultValue?: string
  /** Callback when active tab changes */
  onValueChange?: (value: string) => void
  /** Tab type variant */
  type?: TabType
  /** Tab color variant */
  color?: TabColor
  /** Tab size variant */
  size?: TabSize
  /** Tab orientation */
  orientation?: TabOrientation
  /** Disable all tabs */
  disabled?: boolean
  /** Full width tabs */
  fullWidth?: boolean
  /** Content variant styling */
  contentVariant?: TabContentVariant
  /** Tab trigger sizing mode */
  triggerSizing?: 'auto' | 'equal' | 'fixed'
}

/**
 * Headless hook for managing Tabs state and logic.
 * Use this to build your own completely custom Tabs visual component.
 */
export function useTabs({
  value: valueProp,
  defaultValue,
  onValueChange,
  type = 'default',
  color = 'gray',
  size = 'md',
  orientation = 'horizontal',
  disabled = false,
  fullWidth = false,
  contentVariant = 'default',
  triggerSizing = 'auto',
}: UseTabsProps = {}) {
  // Support both controlled and uncontrolled mode
  const [internalValue, setInternalValue] = useState<string>(defaultValue ?? '')
  const isControlled = valueProp !== undefined
  const value = isControlled ? valueProp : internalValue

  const handleValueChange = useCallback((newValue: string) => {
    if (disabled) return

    // Update internal state if uncontrolled
    if (!isControlled) {
      setInternalValue(newValue)
    }

    // Always call onChange if provided
    onValueChange?.(newValue)
  }, [disabled, isControlled, onValueChange])

  return {
    value,
    onValueChange: handleValueChange,
    type,
    color,
    size,
    orientation,
    disabled,
    fullWidth,
    contentVariant,
    triggerSizing,
  }
}
