/**
 * GlassSurface component types
 * Foundational primitive for all Liquid Glass rendering
 */

import type { ReactNode } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'
import type { GlassMaterial } from '../../tokens/glass'
import type { CardPadding, CardRadius } from '../Card/Card.types'

/** GlassSurface rendering variant */
export type GlassSurfaceVariant = 'standard' | 'control-center'

export interface GlassSurfaceProps {
  /** Content rendered inside the glass surface */
  children: ReactNode
  /** Material density level */
  material?: GlassMaterial
  /** Rendering variant — 'standard' uses material layers, 'control-center' uses 3-layer blend */
  variant?: GlassSurfaceVariant
  /** Border radius */
  radius?: CardRadius
  /** Internal padding */
  padding?: CardPadding
  /** Add elevated shadow beneath the glass */
  elevated?: boolean
  /** Add specular highlight border (subtle edge light refraction) */
  specularBorder?: boolean
  /** Add Control Center inset shadows (web only) */
  insetShadow?: boolean
  /** Additional styles on the outer container */
  style?: StyleProp<ViewStyle>
  /** Test ID */
  testID?: string
}
