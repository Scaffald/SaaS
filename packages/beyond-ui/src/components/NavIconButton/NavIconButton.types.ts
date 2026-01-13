/**
 * NavIconButton component type definitions
 */

import type { ViewStyle } from 'react-native'
import type { IconComponent } from '../types'

/**
 * Badge type for navigation icon button
 */
export type NavIconButtonBadge = 'dot' | 'number'

/**
 * State variant for navigation icon button
 */
export type NavIconButtonState = 'default' | 'hover' | 'pressed'

/**
 * Style variant for navigation icon button
 */
export type NavIconButtonVariant = 'light' | 'outline'

/**
 * NavIconButton component props
 */
export interface NavIconButtonProps {
  /**
   * Icon component to display
   */
  icon?: IconComponent

  /**
   * Badge type to display
   */
  badge?: NavIconButtonBadge

  /**
   * Badge value (for number badge)
   */
  badgeValue?: number | string

  /**
   * Whether to show badge
   * @default false
   */
  showBadge?: boolean

  /**
   * State variant
   * @default 'default'
   */
  state?: NavIconButtonState

  /**
   * Style variant
   * @default 'light'
   */
  variant?: NavIconButtonVariant

  /**
   * Whether button is disabled
   * @default false
   */
  disabled?: boolean

  /**
   * Press handler
   */
  onPress?: () => void

  /**
   * Custom container style
   */
  style?: ViewStyle

  /**
   * Accessibility label
   */
  accessibilityLabel?: string
}