/**
 * Radio wrapper
 * Provides backwards-compatible API for existing code
 */
import React, { forwardRef, useCallback, useId } from 'react'
import { Radio as BeyondRadio, type RadioSize } from '@unicornlove/beyond-ui'

export interface RadioProps {
  label?: string
  error?: string
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

// Map size - Beyond UI Radio only supports 'sm' | 'md', so 'lg' maps to 'md'
const mapSize = (size: 'sm' | 'md' | 'lg'): RadioSize => {
  return size === 'lg' ? 'md' : size
}

const Radio = forwardRef<HTMLInputElement, RadioProps>(
  (
    {
      label,
      error,
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
    const radioId = props.id || generatedId

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
      <BeyondRadio
        checked={checked ?? defaultChecked}
        onChange={handleChange}
        size={mapSize(size)}
        disabled={disabled}
        error={!!error}
        label={labelWithRequired}
        helperText={error || helperText}
        name={props.name}
        value={props.value}
        containerStyle={{ className } as any}
      />
    )
  }
)

Radio.displayName = 'Radio'

export default Radio
