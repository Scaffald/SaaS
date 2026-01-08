/**
 * RadioGroup component types
 */

import type { RadioSize, RadioColor } from './Radio.types'

export type RadioGroupOrientation = 'vertical' | 'horizontal'

export interface RadioGroupOption {
  label: string
  value: string | number
  disabled?: boolean
  helperText?: string
  optional?: boolean
}

export interface RadioGroupProps {
  /**
   * Current selected value
   */
  value?: string | number

  /**
   * Callback when selection changes
   */
  onChange?: (value: string | number) => void

  /**
   * Radio options
   */
  options: RadioGroupOption[]

  /**
   * Orientation of the radio group
   * @default 'vertical'
   */
  orientation?: RadioGroupOrientation

  /**
   * Size of radio buttons
   * @default 'md'
   */
  size?: RadioSize

  /**
   * Color variant
   * @default 'primary'
   */
  color?: RadioColor

  /**
   * Whether the entire group is disabled
   */
  disabled?: boolean

  /**
   * Whether the entire group has an error state
   */
  error?: boolean

  /**
   * Group label
   */
  label?: string

  /**
   * Name attribute for the radio group (for form grouping)
   */
  name?: string

  /**
   * Gap between radio buttons
   * @default 12
   */
  gap?: number

  /**
   * Additional container styles
   */
  containerStyle?: object
}
