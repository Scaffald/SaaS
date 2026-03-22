/**
 * GlassWidget component types
 * Larger dashboard widget tile with Liquid Glass material
 */

import type { ReactNode } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'
import type { GlassMaterial } from '../../tokens/glass'

/** Widget size presets */
export type GlassWidgetSize = 'sm' | 'md' | 'lg'

export interface GlassWidgetProps {
  /** Widget content (rendered below the header) */
  children?: ReactNode
  /** Widget title */
  title?: string
  /** Widget subtitle/detail */
  subtitle?: string
  /** Icon element (rendered in the header) */
  icon?: ReactNode
  /** Glass material density */
  material?: GlassMaterial
  /** Widget size preset */
  size?: GlassWidgetSize
  /** Whether the widget is pressable */
  pressable?: boolean
  /** Press callback */
  onPress?: () => void
  /** Additional styles */
  style?: StyleProp<ViewStyle>
  /** Test ID */
  testID?: string
}
