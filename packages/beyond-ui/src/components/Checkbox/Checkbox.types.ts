/**
 * Checkbox component types
 */

export type CheckboxSize = 'sm' | 'md'
export type CheckboxColor = 'gray' | 'primary'
export type CheckboxState = 'default' | 'hover' | 'focused' | 'disabled' | 'error'

export interface CheckboxProps {
  /**
   * Whether the checkbox is checked
   */
  checked?: boolean

  /**
   * Whether the checkbox is in indeterminate state (dash/minus icon)
   */
  indeterminate?: boolean

  /**
   * Callback when checkbox state changes
   */
  onChange?: (checked: boolean) => void

  /**
   * Size of the checkbox
   * @default 'md'
   */
  size?: CheckboxSize

  /**
   * Color variant
   * @default 'primary'
   */
  color?: CheckboxColor

  /**
   * Whether the checkbox is disabled
   */
  disabled?: boolean

  /**
   * Whether the checkbox has an error state
   */
  error?: boolean

  /**
   * Label text to display next to checkbox
   */
  label?: string

  /**
   * Helper text to display below the label
   */
  helperText?: string

  /**
   * Show "(optional)" text after the label
   */
  optional?: boolean

  /**
   * Custom label element (overrides label prop)
   */
  labelElement?: React.ReactNode

  /**
   * Additional container styles
   */
  containerStyle?: object

  /**
   * Additional checkbox box styles
   */
  checkboxStyle?: object

  /**
   * Additional label styles
   */
  labelStyle?: object

  /**
   * Additional helper text styles
   */
  helperTextStyle?: object
}
