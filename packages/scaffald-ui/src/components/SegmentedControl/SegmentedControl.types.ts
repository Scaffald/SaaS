/**
 * SegmentedControl component types
 * iOS 26 style segmented control with pill-shaped selection indicator
 */

import type { StyleProp, ViewStyle } from 'react-native'

export interface SegmentedControlProps {
  /** Array of segment labels */
  segments: string[]
  /** Index of the currently selected segment */
  selectedIndex: number
  /** Called when a segment is selected */
  onSelectionChange: (index: number) => void
  /** Whether the control is disabled */
  disabled?: boolean
  /** Additional styles */
  style?: StyleProp<ViewStyle>
  /** Test ID */
  testID?: string
}
