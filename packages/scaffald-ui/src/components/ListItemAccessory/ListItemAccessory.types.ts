/**
 * ListItemAccessory types
 * iOS 26 list item trailing accessories
 */

import type { ViewStyle } from 'react-native'

/** Accessory types matching iOS 26 HIG */
export type ListItemAccessoryType =
  | 'detail'
  | 'checkmark'
  | 'info'
  | 'disclosure'
  | 'symbol'
  | 'toggle'

export interface ListItemAccessoryProps {
  /** Type of accessory to render */
  type: ListItemAccessoryType
  /** Detail text (shown for all types except toggle) */
  detail?: string
  /** Whether to show the detail text */
  showDetail?: boolean
  /** SF Symbol character (for 'symbol' type) */
  symbol?: string
  /** Toggle state (for 'toggle' type) */
  checked?: boolean
  /** Toggle change handler (for 'toggle' type) */
  onToggleChange?: (value: boolean) => void
  /** Whether the parent row is selected */
  selected?: boolean
  /** Custom style */
  style?: ViewStyle
}
