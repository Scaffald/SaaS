/**
 * Input component types
 * Mapped from Figma Forsured Design System Input Field component
 */

import type { ViewStyle, TextStyle, TextInputProps } from 'react-native'

/**
 * Input state variants
 */
export type InputState = 'default' | 'hover' | 'focused' | 'error' | 'filled'

/**
 * Input style variants
 */
export type InputType = 'classic' | 'line'

/**
 * Input props
 */
export interface InputProps extends Omit<TextInputProps, 'style'> {
  /**
   * Label text displayed above the input
   */
  label?: string

  /**
   * Show asterisk to indicate required field
   * @default false
   */
  required?: boolean

  /**
   * Helper text displayed below the input
   */
  helperText?: string

  /**
   * Error message (overrides helperText when present)
   */
  error?: string

  /**
   * Input state variant
   * @default 'default'
   */
  state?: InputState

  /**
   * Style variant (Classic or Line)
   * @default 'classic'
   */
  type?: InputType

  /**
   * External addon (prefix) displayed before the input
   * For example: "https://" for URL inputs
   */
  externalAddon?: string

  /**
   * Leading icon component
   */
  iconStart?: React.ComponentType<{ size: number; color: string }>

  /**
   * Trailing icon component (displayed on the right)
   */
  iconEnd?: React.ComponentType<{ size: number; color: string }>

  /**
   * Disabled state
   * @default false
   */
  disabled?: boolean

  /**
   * Full width input
   * @default true
   */
  fullWidth?: boolean

  /**
   * Custom input container style
   */
  containerStyle?: ViewStyle

  /**
   * Custom input text style
   */
  inputStyle?: TextStyle

  /**
   * Custom label style
   */
  labelStyle?: TextStyle

  /**
   * Custom helper text style
   */
  helperTextStyle?: TextStyle

  /**
   * Show password strength indicator (only for password inputs)
   * @default false
   */
  showPasswordStrength?: boolean

  /**
   * Password strength level (used when showPasswordStrength is true)
   */
  passwordStrength?: 'too-weak' | 'weak' | 'good' | 'strong'

  /**
   * Password requirements checklist (used when showPasswordStrength is true and variant is 'checklist')
   */
  passwordRequirements?: Array<{ label: string; met: boolean }>
}

/**
 * Input style configuration
 */
export interface InputStyleConfig {
  container: ViewStyle
  input: ViewStyle
  inputText: TextStyle
  label: TextStyle
  helperText: TextStyle
  iconColor: string
  externalAddonContainer?: ViewStyle
  externalAddonText?: TextStyle
}
