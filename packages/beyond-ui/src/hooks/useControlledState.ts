/**
 * useControlledState hook
 * Manages controlled and uncontrolled state for form components
 *
 * This hook eliminates the need for duplicated controlled/uncontrolled
 * state management patterns across form components like Checkbox, Radio,
 * Toggle, SelectionCard, Accordion, Dropdown, etc.
 *
 * @example
 * ```tsx
 * function Checkbox({ checked, defaultChecked, onChange }) {
 *   const [isChecked, setIsChecked] = useControlledState(
 *     checked,
 *     defaultChecked ?? false,
 *     onChange
 *   )
 *   // Use isChecked and setIsChecked as normal state
 * }
 * ```
 */

import { useState, useCallback } from 'react'

/**
 * Manages controlled and uncontrolled state
 *
 * @param controlledValue - The controlled value (if provided, component is controlled)
 * @param defaultValue - The default value for uncontrolled mode
 * @param onChange - Callback fired when value changes
 * @returns [value, setValue] tuple
 */
export function useControlledState<T>(
  controlledValue: T | undefined,
  defaultValue: T,
  onChange?: (value: T) => void
): [T, (value: T) => void] {
  const [internalValue, setInternalValue] = useState<T>(defaultValue)

  // Component is controlled if controlledValue is provided
  const isControlled = controlledValue !== undefined

  // Use controlled value if provided, otherwise use internal state
  const value = isControlled ? controlledValue : internalValue

  const setValue = useCallback(
    (newValue: T) => {
      // Only update internal state if uncontrolled
      if (!isControlled) {
        setInternalValue(newValue)
      }

      // Always call onChange callback
      onChange?.(newValue)
    },
    [isControlled, onChange]
  )

  return [value, setValue]
}
