/**
 * Button component types
 * Mapped from Figma Forsured Design System Button CTA component
 */

import type { ViewStyle, TextStyle, PressableProps } from 'react-native'

/**
 * Button color variants
 */
export type ButtonColor = 'gray' | 'primary' | 'success' | 'error'

/**
 * Button style variants
 */
export type ButtonVariant = 'filled' | 'outline' | 'light' | 'text'

/**
 * Button size variants
 */
export type ButtonSize = 'sm' | 'md' | 'lg'

/**
 * Button props
 */
export interface ButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  /**
   * Button text content
   */
  children?: React.ReactNode

  /**
   * Color variant
   * @default 'gray'
   */
  color?: ButtonColor

  /**
   * Style variant
   * @default 'filled'
   */
  variant?: ButtonVariant

  /**
   * Size variant
   * @default 'md'
   */
  size?: ButtonSize

  /**
   * Disabled state
   * @default false
   */
  disabled?: boolean

  /**
   * Full width button
   * @default false
   */
  fullWidth?: boolean

  /**
   * Icon to display at the start
   */
  iconStart?: React.ComponentType<{ size: number; color: string }>

  /**
   * Icon to display at the end
   */
  iconEnd?: React.ComponentType<{ size: number; color: string }>

  /**
   * Icon-only button (no text)
   * @default false
   */
  iconOnly?: boolean

  /**
   * Loading state
   * @default false
   */
  loading?: boolean

  /**
   * Custom button container style
   */
  style?: ViewStyle

  /**
   * Custom text style
   */
  textStyle?: TextStyle

  /**
   * Press handler
   */
  onPress?: () => void
}

/**
 * Button style configuration
 */
export interface ButtonStyleConfig {
  container: ViewStyle
  text: TextStyle
  iconColor: string
  hover: ViewStyle
  pressed: ViewStyle
}
