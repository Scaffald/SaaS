/**
 * SearchAccessory component types
 * iOS 26 search bar with optional scope segmented control (iPad)
 */

import type { StyleProp, ViewStyle } from 'react-native'

export interface SearchAccessoryScope {
  /** Display label */
  label: string
  /** Unique value */
  value: string
}

export interface SearchAccessoryProps {
  /** Current search text value */
  value?: string
  /** Called when text changes */
  onChangeText?: (text: string) => void
  /** Placeholder text (default: "Search") */
  placeholder?: string
  /** Optional scope filter tabs */
  scopes?: SearchAccessoryScope[]
  /** Currently selected scope value */
  selectedScope?: string
  /** Called when scope selection changes */
  onScopeChange?: (scope: string) => void
  /** Show microphone icon (default: true) */
  showMicrophone?: boolean
  /** Additional styles */
  style?: StyleProp<ViewStyle>
  /** Test ID */
  testID?: string
}
