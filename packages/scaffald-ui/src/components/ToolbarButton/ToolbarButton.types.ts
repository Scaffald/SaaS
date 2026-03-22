/**
 * ToolbarButton component types
 * iOS 26 toolbar button — icon, text, filled, or back variants
 */

import type { ReactNode } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'

export type ToolbarButtonVariant = 'icon' | 'text' | 'filled' | 'back'

export interface ToolbarButtonProps {
  /** Icon element to render */
  icon?: ReactNode
  /** Text label (for text, filled, and back variants) */
  label?: string
  /** Button visual variant */
  variant?: ToolbarButtonVariant
  /** Press handler */
  onPress?: () => void
  /** Whether the button is disabled */
  disabled?: boolean
  /** Override tint color */
  tintColor?: string
  /** Additional styles */
  style?: StyleProp<ViewStyle>
  /** Accessibility label */
  accessibilityLabel?: string
  /** Test ID */
  testID?: string
}

/** Config object for declaring toolbar buttons in groups */
export interface ToolbarButtonConfig {
  /** Unique key */
  key: string
  /** Icon element */
  icon?: ReactNode
  /** Text label */
  label?: string
  /** Button variant */
  variant?: ToolbarButtonVariant
  /** Press handler */
  onPress?: () => void
  /** Whether disabled */
  disabled?: boolean
  /** Override tint color */
  tintColor?: string
  /** Accessibility label */
  accessibilityLabel?: string
}
