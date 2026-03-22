/**
 * Button component types
 * Mapped from Figma Forsured Design System Button CTA component
 */

import type { ViewStyle, TextStyle, PressableProps } from 'react-native'
import type { IconComponent } from '../types'

/**
 * Button color variants
 */
export type ButtonColor = 'gray' | 'primary' | 'success' | 'error'

/**
 * Button style variants
 *
 * iOS 26 variants (from Apple HIG):
 * - 'bordered-prominent': Solid accent fill with white text (maps to iOS Bordered Prominent)
 * - 'bordered': Subtle fill with accent text (maps to iOS Bordered)
 * - 'borderless': No background, accent text only (maps to iOS Borderless)
 */
export type ButtonVariant =
  | 'filled'
  | 'outline'
  | 'light'
  | 'text'
  | 'glass'
  | 'bordered-prominent'
  | 'bordered'
  | 'borderless'

/**
 * Button size variants
 *
 * iOS 26 sizes (when using iOS variants):
 * - 'sm': 28px height, 15px font
 * - 'md': 34px height, 15px font
 * - 'lg': 50px height, 17px font
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
  iconStart?: IconComponent

  /**
   * Icon to display at the end
   */
  iconEnd?: IconComponent

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
   * Destructive action (renders text/icon in red)
   * Applies to iOS 26 variants: bordered-prominent shows red bg, others show red text
   * @default false
   */
  destructive?: boolean

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
