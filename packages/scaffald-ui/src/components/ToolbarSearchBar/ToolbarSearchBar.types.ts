/**
 * ToolbarSearchBar component types
 * iOS 26 search bar for toolbar contexts
 */

import type { StyleProp, ViewStyle } from 'react-native'

export interface ToolbarSearchBarProps {
  /** Current search text value */
  value?: string
  /** Called when text changes */
  onChangeText?: (text: string) => void
  /** Placeholder text (default: "Search") */
  placeholder?: string
  /** Called when input gains focus */
  onFocus?: () => void
  /** Called when input loses focus */
  onBlur?: () => void
  /** Called when cancel/close is pressed */
  onCancel?: () => void
  /** Show microphone icon (default: true) */
  showMicrophone?: boolean
  /** Show clear button when text is present (default: true) */
  showClear?: boolean
  /** Whether the search bar is focused/active */
  active?: boolean
  /** Additional styles */
  style?: StyleProp<ViewStyle>
  /** Test ID */
  testID?: string
}
