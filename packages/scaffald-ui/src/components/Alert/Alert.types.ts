/**
 * Alert component type definitions
 */

import type { ViewStyle, TextStyle } from 'react-native'

export type AlertType = 'info' | 'success' | 'warning' | 'error' | 'ai'
export type AlertVariant = 'linear' | 'light' | 'filled'
export type AlertActionsPosition = 'bottom' | 'right'

export interface AlertAction {
  /** Action button label */
  label: string
  /** Action button press handler */
  onPress: () => void
  /** Optional custom style for action button text */
  style?: TextStyle
}

export interface AlertProps {
  // Required
  /** Alert title text */
  title: string

  // Type & Style
  /** Alert type - determines icon and colors */
  type?: AlertType
  /** Style variant */
  variant?: AlertVariant

  // Optional Content
  /** Optional description text */
  description?: string

  // Actions
  /** Action buttons configuration (max 2 buttons) */
  actions?: AlertAction[]
  /** Position of action buttons */
  actionsPosition?: AlertActionsPosition

  // Dismissible behavior (alerts are dismissible by default)
  /** Controlled visibility state - if true, alert is visible */
  visible?: boolean
  /** Default visibility for uncontrolled mode */
  defaultVisible?: boolean
  /** Callback when close button is pressed */
  onClose?: () => void
  /** Whether to show close button */
  dismissible?: boolean

  // Styling
  /** Custom container style */
  style?: ViewStyle
  /** Custom title style */
  titleStyle?: TextStyle
  /** Custom description style */
  descriptionStyle?: TextStyle
}
