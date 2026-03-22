/**
 * GlassPanel component types
 * Content container for dashboard widgets and panels with Liquid Glass material
 */

import type { ReactNode } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'
import type { GlassMaterial } from '../../tokens/glass'
import type { CardPadding, CardRadius } from '../Card/Card.types'

export interface GlassPanelProps {
  /** Panel content */
  children: ReactNode
  /** Glass material density */
  material?: GlassMaterial
  /** Internal padding */
  padding?: CardPadding
  /** Border radius */
  radius?: CardRadius
  /** Optional header content (rendered above children) */
  header?: ReactNode
  /** Optional footer content (rendered below children) */
  footer?: ReactNode
  /** Whether the panel is pressable */
  pressable?: boolean
  /** Press callback */
  onPress?: () => void
  /** Additional styles */
  style?: StyleProp<ViewStyle>
  /** Test ID */
  testID?: string
}
