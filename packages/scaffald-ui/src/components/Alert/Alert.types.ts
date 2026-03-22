/**
 * Alert component type definitions
 * Supports both legacy inline alert and iOS 26 modal alert styles
 */

import type { ViewStyle, TextStyle } from 'react-native'

export type AlertType = 'info' | 'success' | 'warning' | 'error' | 'ai'
export type AlertVariant = 'linear' | 'light' | 'filled'
export type AlertActionsPosition = 'bottom' | 'right'
export type AlertButtonLayout = 'stacked' | 'side-by-side'

export interface AlertAction {
  /** Action button label */
  label: string
  /** Action button press handler */
  onPress: () => void
  /** Optional custom style for action button text */
  style?: TextStyle
}

/** Text field configuration for iOS 26 alert text inputs */
export interface AlertTextField {
  /** Current text value */
  value: string
  /** Placeholder text */
  placeholder?: string
  /** Change handler */
  onChangeText: (text: string) => void
  /** Whether to obscure text (password entry) */
  secureTextEntry?: boolean
}

export interface AlertProps {
  // Required
  /** Alert title text */
  title: string

  // Type & Style
  /** Alert type - determines icon and colors (used by inline variant) */
  type?: AlertType
  /** Style variant (used by inline variant) */
  variant?: AlertVariant

  // Optional Content
  /** Optional description text */
  description?: string

  // Legacy Actions (inline variant)
  /** Action buttons configuration (max 2 buttons) - legacy inline style */
  actions?: AlertAction[]
  /** Position of action buttons (inline variant only) */
  actionsPosition?: AlertActionsPosition

  // iOS 26 Modal Actions
  /** Primary action button (blue accent) */
  primaryAction?: AlertAction
  /** Destructive action button (red text) */
  destructiveAction?: AlertAction
  /** Secondary action button (gray) */
  secondaryAction?: AlertAction
  /** Button layout for iOS 26 modal: 'stacked' (default) or 'side-by-side' */
  layout?: AlertButtonLayout

  // iOS 26 Text Fields
  /** Optional text input fields (iOS 26 modal only) */
  textFields?: AlertTextField[]

  // Dismissible behavior (alerts are dismissible by default)
  /** Controlled visibility state - if true, alert is visible */
  visible?: boolean
  /** Default visibility for uncontrolled mode */
  defaultVisible?: boolean
  /** Callback when close button is pressed */
  onClose?: () => void
  /** Whether to show close button (inline) or allow backdrop dismiss (modal) */
  dismissible?: boolean

  // Styling
  /** Custom container style */
  style?: ViewStyle
  /** Custom title style */
  titleStyle?: TextStyle
  /** Custom description style */
  descriptionStyle?: TextStyle
}
