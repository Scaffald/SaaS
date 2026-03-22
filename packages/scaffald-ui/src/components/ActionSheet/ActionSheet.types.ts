/**
 * ActionSheet component types
 * iOS 26 action sheet with glassmorphic design
 */

import type { ViewStyle } from 'react-native'

/**
 * Individual action in the action sheet
 */
export interface ActionSheetAction {
  /** Action button label */
  label: string
  /** Callback when action is pressed */
  onPress: () => void
  /** Renders the action in red destructive color */
  destructive?: boolean
  /** Disables the action */
  disabled?: boolean
}

/**
 * ActionSheet props
 */
export interface ActionSheetProps {
  /** Controls visibility of the action sheet */
  visible: boolean
  /** Called when the action sheet should close (backdrop press, cancel, etc.) */
  onClose: () => void
  /** Optional title displayed at the top */
  title?: string
  /** Optional description below the title */
  description?: string
  /** Array of actions to display as buttons */
  actions: ActionSheetAction[]
  /** Label for the cancel button. Set to null to hide cancel button */
  cancelLabel?: string | null
  /** Custom style for the action sheet container */
  style?: ViewStyle
}
