/**
 * GlassIconButton component types
 * Circular icon button with Liquid Glass material (Control Center style)
 */

import type { ReactNode } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'
import type { GlassMaterial } from '../../tokens/glass'

/** GlassIconButton size presets */
export type GlassIconButtonSize = 'sm' | 'md' | 'lg'

export interface GlassIconButtonProps {
  /** Icon element to render */
  icon: ReactNode
  /** Press callback */
  onPress: () => void
  /** Whether the button is in active/toggled state (accent tint) */
  active?: boolean
  /** Active state accent color (CSS color string) */
  activeColor?: string
  /** Button size */
  size?: GlassIconButtonSize
  /** Glass material density */
  material?: GlassMaterial
  /** Whether the button is disabled */
  disabled?: boolean
  /** Accessibility label (required for icon-only buttons) */
  accessibilityLabel: string
  /** Additional styles */
  style?: StyleProp<ViewStyle>
  /** Test ID */
  testID?: string
  /** Whether to skip rendering own glass surface (used inside GlassGroup) */
  _skipSurface?: boolean
}
