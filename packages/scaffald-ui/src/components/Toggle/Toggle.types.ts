/**
 * Toggle component types
 */

export type ToggleSize = 'sm' | 'md'
export type ToggleColor = 'gray' | 'primary' | 'red-green'
export type ToggleState = 'default' | 'hover' | 'focused' | 'disabled'

export interface ToggleProps {
  /**
   * Whether the toggle is checked (on)
   */
  checked?: boolean

  /**
   * Callback when toggle state changes
   */
  onChange?: (checked: boolean) => void

  /**
   * Size of the toggle
   * @default 'md'
   */
  size?: ToggleSize

  /**
   * Color variant
   * @default 'primary'
   */
  color?: ToggleColor

  /**
   * Whether the toggle is disabled
   */
  disabled?: boolean

  /**
   * Whether the toggle has an error state
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
   * Label text to display next to toggle
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
   * Toggle switch style
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

  /**
   * Accessibility label for screen readers
   */
  accessibilityLabel?: string
}
