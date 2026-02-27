/**
 * Checkbox wrapper
 * Provides backwards-compatible API for existing code
 */
import React, { forwardRef, useCallback, useId } from 'react'
import { Checkbox as BeyondCheckbox, type CheckboxSize } from '@scaffald/ui'

export interface CheckboxProps {
  label?: string
  error?: string
  helperText?: string
  indeterminate?: boolean
  size?: 'sm' | 'md' | 'lg'
  checked?: boolean
  defaultChecked?: boolean
  disabled?: boolean
  required?: boolean
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void
  onCheckedChange?: (checked: boolean) => void
  id?: string
  name?: string
  value?: string
  className?: string
}

// Map size - Beyond UI only supports 'sm' | 'md', so 'lg' maps to 'md'
const mapSize = (size: 'sm' | 'md' | 'lg'): CheckboxSize => {
  return size === 'lg' ? 'md' : size
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      label,
      error,
      helperText,
      indeterminate = false,
      size = 'md',
      checked,
      defaultChecked,
      disabled,
      required,
      onChange,
      onCheckedChange,
      className = '',
      ...props
    },
    _ref
  ) => {
    const generatedId = useId()
    const checkboxId = props.id || generatedId

    // Handle both old onChange (event-based) and new onCheckedChange (boolean) APIs
    const handleChange = useCallback(
      (isChecked: boolean) => {
        onCheckedChange?.(isChecked)
        // Simulate event for backwards compatibility
        if (onChange) {
          const syntheticEvent = {
            target: { checked: isChecked, name: props.name, value: props.value },
            currentTarget: { checked: isChecked, name: props.name, value: props.value },
          } as React.ChangeEvent<HTMLInputElement>
          onChange(syntheticEvent)
        }
      },
      [onChange, onCheckedChange, props.name, props.value]
    )

    // Build label with required indicator if needed
    const labelWithRequired = label && required ? `${label} *` : label

    return (
      <BeyondCheckbox
        checked={checked ?? defaultChecked}
        indeterminate={indeterminate}
        onChange={handleChange}
        size={mapSize(size)}
        disabled={disabled}
        error={!!error}
        label={labelWithRequired}
        helperText={error || helperText}
        containerStyle={{ className } as any}
      />
    )
  }
)

Checkbox.displayName = 'Checkbox'

export default Checkbox
