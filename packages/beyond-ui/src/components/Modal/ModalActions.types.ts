/**
 * ModalActions component type definitions
 */

import type { ViewStyle } from 'react-native'
import type React from 'react'
import type { ButtonVariant, ButtonColor } from '../Button/Button.types'

export type ModalActionsOrientation = 'center' | 'right'

/**
 * Modal action button configuration
 */
export interface ModalAction {
  /**
   * Button label text
   */
  label: string

  /**
   * Button press handler
   */
  onPress: () => void

  /**
   * Button variant
   * @default 'filled' for primary, 'outline' for secondary
   */
  variant?: ButtonVariant

  /**
   * Button color
   * @default 'primary' for primary, 'gray' for secondary
   */
  color?: ButtonColor

  /**
   * Whether button is disabled
   * @default false
   */
  disabled?: boolean

  /**
   * Whether button is in loading state
   * @default false
   */
  loading?: boolean
}

export interface ModalActionsProps {
  /**
   * Actions orientation
   * @default 'center'
   */
  orientation?: ModalActionsOrientation

  /**
   * Primary action button configuration
   */
  primaryAction?: ModalAction

  /**
   * Secondary action button configuration
   */
  secondaryAction?: ModalAction

  /**
   * Optional sub-actions content (checkbox, toggle, message, etc.)
   */
  subActions?: React.ReactNode

  /**
   * Custom style for the actions container
   */
  style?: ViewStyle

  /**
   * Custom style for the sub-actions container
   */
  subActionsStyle?: ViewStyle

  /**
   * Custom style for the buttons container
   */
  buttonsStyle?: ViewStyle
}
