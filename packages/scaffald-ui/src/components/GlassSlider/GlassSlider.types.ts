/**
 * GlassSlider component types
 * Slider control with Liquid Glass track (Control Center brightness/volume style)
 */

import type { ReactNode } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'
import type { GlassMaterial } from '../../tokens/glass'

export interface GlassSliderProps {
  /** Current value (0-1 normalized) */
  value: number
  /** Called when the value changes */
  onValueChange: (value: number) => void
  /** Minimum value */
  min?: number
  /** Maximum value */
  max?: number
  /** Whether the slider is vertical (like iOS Control Center brightness/volume) */
  vertical?: boolean
  /** Icon rendered at the bottom/left of the slider */
  icon?: ReactNode
  /** Glass material density for the track */
  material?: GlassMaterial
  /** Width of the slider (or height if vertical) */
  trackSize?: number
  /** Length of the slider */
  trackLength?: number
  /** Whether the slider is disabled */
  disabled?: boolean
  /** Accessibility label */
  accessibilityLabel?: string
  /** Additional styles */
  style?: StyleProp<ViewStyle>
  /** Test ID */
  testID?: string
}
