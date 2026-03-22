/**
 * EditMenu component types
 * iOS 26 floating glassmorphic edit menu for text selection
 */

import type { ViewStyle } from 'react-native'

/**
 * Individual action in the edit menu
 */
export interface EditMenuAction {
  /** Action label (e.g. "Copy", "Paste", "Delete") */
  label: string
  /** Callback when action is pressed */
  onPress: () => void
  /** Renders the action in red destructive color */
  destructive?: boolean
  /** Disables the action */
  disabled?: boolean
}

/**
 * EditMenu props
 */
export interface EditMenuProps {
  /** Controls visibility of the edit menu */
  visible: boolean
  /** Array of inline actions displayed as text labels */
  actions: EditMenuAction[]
  /** Callback when the trailing "more" chevron button is pressed */
  onMore?: () => void
  /** Custom style for the edit menu container */
  style?: ViewStyle
}
