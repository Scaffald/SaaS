/**
 * GlassGroup component types
 * Groups multiple GlassIconButtons under a single shared glass surface
 */

import type { ReactNode } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'
import type { GlassMaterial } from '../../tokens/glass'
import type { CardRadius } from '../Card/Card.types'

export interface GlassGroupProps {
  /** GlassIconButton children (they will skip their own surface rendering) */
  children: ReactNode
  /** Layout direction */
  direction?: 'row' | 'column'
  /** Glass material density */
  material?: GlassMaterial
  /** Gap between items in pixels */
  gap?: number
  /** Border radius */
  radius?: CardRadius
  /** Additional styles */
  style?: StyleProp<ViewStyle>
  /** Test ID */
  testID?: string
}
