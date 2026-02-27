export type RangeSliderSize = 'small' | 'medium' | 'large'

export interface RangeSliderProps {
  /** Current value */
  value: number
  /** Callback when value changes */
  onValueChange: (value: number) => void
  /** Minimum value */
  min?: number
  /** Maximum value */
  max?: number
  /** Step size */
  step?: number
  /** Disabled state */
  disabled?: boolean
  /** Size variant */
  size?: RangeSliderSize
  /** testID for tests */
  testID?: string
}
