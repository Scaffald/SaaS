/**
 * Radio component types
 */

export type RadioSize = 'sm' | 'md'
export type RadioColor = 'gray' | 'primary'
export type RadioState = 'default' | 'hover' | 'focused' | 'disabled' | 'error'

export interface RadioProps {
  /**
   * Whether the radio is checked
   */
  checked?: boolean

  /**
   * Callback when radio state changes
   */
  onChange?: (checked: boolean) => void

  /**
   * Size of the radio
   * @default 'md'
   */
  size?: RadioSize

  /**
   * Color variant
   * @default 'primary'
   */
  color?: RadioColor

  /**
   * Whether the radio is disabled
   */
  disabled?: boolean

  /**
   * Whether the radio has an error state
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
   * Label text to display next to radio
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
   * Value for the radio button (used in RadioGroup)
   */
  value?: string | number

  /**
   * Name attribute for the radio input (used for form grouping)
   */
  name?: string

  /**
   * Container style
   */
  style?: object

  /**
   * Radio circle style
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
