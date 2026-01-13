/**
 * StatusIndicator component type definitions
 */

import type { TextStyle, ViewStyle } from 'react-native'

export type StatusIndicatorType = 'caution' | 'success' | 'undefined' | 'in-progress' | 'error' | 'help'
export type StatusIndicatorStyle = 'blank' | 'light' | 'outline' | 'filled'
export type StatusIndicatorIconType = 'filled' | 'linear' | 'dot'

export interface StatusIndicatorProps {
  /** Status type - determines icon and colors */
  type?: StatusIndicatorType
  /** Style variant */
  variant?: StatusIndicatorStyle
  /** Icon type - filled, linear (outline), or dot */
  iconType?: StatusIndicatorIconType
  /** Label text */
  label: string
  /** Custom container style */
  style?: ViewStyle
  /** Custom label style */
  labelStyle?: TextStyle
}
