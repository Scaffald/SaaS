/**
 * ToolbarButtonGroup component types
 * iOS 26 grouped toolbar buttons in a glass pill container
 */

import type { StyleProp, ViewStyle } from 'react-native'
import type { ToolbarButtonConfig } from '../ToolbarButton'

export type ToolbarButtonGroupPosition = 'top' | 'bottom'

export interface ToolbarButtonGroupProps {
  /** Array of button configurations (1-7 items) */
  buttons: ToolbarButtonConfig[]
  /** Position affects sizing — top buttons are slightly more compact */
  position?: ToolbarButtonGroupPosition
  /** Whether to wrap buttons in a glass pill container */
  glass?: boolean
  /** Additional styles */
  style?: StyleProp<ViewStyle>
  /** Test ID */
  testID?: string
}
