/**
 * Switch wrapper Toggle
 * Provides backwards-compatible API for existing code
 */
import React, { forwardRef, useCallback, useId } from 'react'
import { Toggle, type ToggleSize } from '@unicornlove/beyond-ui'

export interface SwitchProps {
  label?: string
  helperText?: string
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

// Map size - Beyond UI Toggle only supports 'sm' | 'md', so 'lg' maps to 'md'
const mapSize = (size: 'sm' | 'md' | 'lg'): ToggleSize => {
  return size === 'lg' ? 'md' : size
}

const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  (
    {
      label,
      helperText,
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
    const switchId = props.id || generatedId

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
      <Toggle
        checked={checked ?? defaultChecked}
        onChange={handleChange}
        size={mapSize(size)}
        disabled={disabled}
        label={labelWithRequired}
        helperText={helperText}
        containerStyle={{ className } as any}
      />
    )
  }
)

Switch.displayName = 'Switch'

export default Switch
