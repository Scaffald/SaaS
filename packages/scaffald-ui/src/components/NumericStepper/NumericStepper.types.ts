/**
 * NumericStepper types
 * iOS 26 minus/plus increment control
 */

import type { ViewStyle } from 'react-native'

export interface NumericStepperProps {
  /** Current value */
  value: number
  /** Minimum value */
  min?: number
  /** Maximum value */
  max?: number
  /** Step increment */
  step?: number
  /** Change handler */
  onChange: (value: number) => void
  /** Disabled state */
  disabled?: boolean
  /** Custom style */
  style?: ViewStyle
}
