/**
 * ConfirmationModal component type definitions
 */

import type { ViewStyle, TextStyle } from 'react-native'
import type React from 'react'

export interface ConfirmationModalProps {
  /**
   * Confirmation message text
   */
  message: string

  /**
   * Optional custom icon (default: CheckCircle with success gradient)
   */
  icon?: React.ReactNode

  /**
   * Custom style for the container
   */
  style?: ViewStyle

  /**
   * Custom style for the icon container
   */
  iconStyle?: ViewStyle

  /**
   * Custom style for the message text
   */
  messageStyle?: TextStyle
}
