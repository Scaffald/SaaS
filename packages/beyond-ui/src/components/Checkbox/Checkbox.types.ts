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
   * Error message to display when error is true
   */
  errorMessage?: string

  /**
   * Whether to show error state visually
   * @default true when error is true
   */
  showError?: boolean

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
   * Container style
   */
  style?: object

  /**
   * Checkbox box style
   */
  contentStyle?: object

  /**
   * Additional label styles
   */
  labelStyle?: object

  /**
   * Additional helper text styles
   */
  helperTextStyle?: object
}
