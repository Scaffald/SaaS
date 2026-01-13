/**
 * ModalHeader component type definitions
 */

import type { ViewStyle, TextStyle } from 'react-native'
import type React from 'react'

export type ModalHeaderOrientation = 'left' | 'center'

export interface ModalHeaderProps {
  /**
   * Modal title text
   */
  title?: string

  /**
   * Modal description text
   */
  description?: string

  /**
   * Header orientation
   * @default 'left'
   */
  orientation?: ModalHeaderOrientation

  /**
   * Optional icon element (48px, rounded-xl, bordered)
   */
  icon?: React.ReactNode

  /**
   * Whether to show close button
   * @default true
   */
  showCloseButton?: boolean

  /**
   * Close button press handler
   */
  onClose?: () => void

  /**
   * Custom style for the header container
   */
  style?: ViewStyle

  /**
   * Custom style for the title text
   */
  titleStyle?: TextStyle

  /**
   * Custom style for the description text
   */
  descriptionStyle?: TextStyle

  /**
   * Custom style for the icon container
   */
  iconStyle?: ViewStyle

  /**
   * Custom style for the close button
   */
  closeButtonStyle?: ViewStyle
}
