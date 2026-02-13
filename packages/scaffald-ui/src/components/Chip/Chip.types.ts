/**
 * Chip component types
 */

import type { ViewStyle, TextStyle, PressableProps } from 'react-native'
import type React from 'react'

export type ChipType = 'default' | 'icon' | 'avatar' | 'flag' | 'brand-icon' | 'crypto'
export type ChipSize = 'sm' | 'md' | 'lg'

export interface ChipProps extends Omit<PressableProps, 'style' | 'children'> {
  /**
   * Content of the chip (text or custom node)
   */
  children: string | React.ReactNode

  /**
   * Type of chip - determines leading content style
   * @default 'default'
   */
  type?: ChipType

  /**
   * Size of the chip
   * @default 'md'
   */
  size?: ChipSize

  /**
   * Whether the chip is disabled
   */
  disabled?: boolean

  /**
   * Whether the chip is selected (for selectable chips)
   */
  selected?: boolean

  /**
   * Callback when chip is pressed
   */
  onPress?: () => void

  /**
   * Show close icon (makes chip dismissible)
   */
  closeIcon?: boolean

  /**
   * Callback when close icon is pressed
   */
  onClose?: () => void

  /**
   * Icon component for icon type
   */
  icon?: React.ComponentType<{ size: number; color: string }>

  /**
   * Avatar content for avatar type
   */
  avatar?: React.ReactNode

  /**
   * Flag content for flag type
   */
  flag?: React.ReactNode

  /**
   * Brand icon content for brand-icon type
   */
  brandIcon?: React.ReactNode

  /**
   * Crypto icon content for crypto type
   */
  crypto?: React.ReactNode

  /**
   * Custom style for the chip container
   */
  style?: ViewStyle

  /**
   * Custom style for the text
   */
  textStyle?: TextStyle
}
