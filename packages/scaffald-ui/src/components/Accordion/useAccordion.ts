import { useState, useCallback } from 'react'
import type { AccordionMode, AccordionValue, AccordionWidth } from './Accordion.types'

export interface UseAccordionProps {
  /** Current expanded value(s) - controlled mode */
  value?: AccordionValue
  /** Default expanded value(s) - uncontrolled mode */
  defaultValue?: AccordionValue
  /** Callback when value changes */
  onValueChange?: (value: AccordionValue) => void
  /** Mode: 'single' (one item open) or 'multiple' (many items open) */
  mode?: AccordionMode
  /** Width behavior: 'fluid' (stretches with content) or 'constrained' (fixed width) */
  width?: AccordionWidth
  /** Disabled state for all items */
  disabled?: boolean
}

/**
 * Headless hook for managing Accordion state and logic.
 * Use this to build your own completely custom Accordion visual component.
 */
export function useAccordion({
  value: valueProp,
  defaultValue,
  onValueChange,
  mode = 'single',
  width = 'constrained',
  disabled = false,
}: UseAccordionProps = {}) {
  // Support both controlled and uncontrolled mode
  const [internalValue, setInternalValue] = useState<AccordionValue>(
    defaultValue ?? (mode === 'single' ? '' : [])
  )
  const isControlled = valueProp !== undefined
  const value = isControlled ? valueProp : internalValue

  const handleValueChange = useCallback((itemValue: string) => {
    if (disabled) return

    let newValue: AccordionValue

    if (mode === 'single') {
      // Single mode: toggle the item or set new item
      newValue = value === itemValue ? '' : itemValue
    } else {
      // Multiple mode: toggle item in array
      const currentArray = Array.isArray(value) ? value : []
      newValue = currentArray.includes(itemValue)
        ? currentArray.filter((v) => v !== itemValue)
        : [...currentArray, itemValue]
    }

    // Update internal state if uncontrolled
    if (!isControlled) {
      setInternalValue(newValue)
    }

    // Always call onChange if provided
    onValueChange?.(newValue)
  }, [disabled, mode, value, isControlled, onValueChange])

  return {
    // State
    value,
    mode,
    width,
    disabled,
    
    // Actions
    onValueChange: handleValueChange,
  }
}
