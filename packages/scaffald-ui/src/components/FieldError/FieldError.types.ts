/**
 * FieldError component type definitions
 * Standard pattern for field-level error display (aligns with API_CONVENTIONS / errorMessage)
 */

import type { ViewStyle, TextStyle } from 'react-native'

export interface FieldErrorProps {
  /**
   * Error message to display. Hidden when undefined or empty.
   */
  message?: string

  /**
   * Show icon before error text
   * @default true
   */
  showIcon?: boolean

  /**
   * Container style
   */
  style?: ViewStyle

  /**
   * Text style
   */
  textStyle?: TextStyle
}
