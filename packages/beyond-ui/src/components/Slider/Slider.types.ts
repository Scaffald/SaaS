/**
 * Slider component types
 */

import type { ViewStyle, } from 'react-native'

export type SliderColor = 'primary' | 'gray'
export type SliderIndicatorPosition = 'top' | 'bottom' | 'none'
export type SliderHandleState = 'default' | 'active'

export interface SliderProps {
  /**
   * Single value (0-100 or between min/max)
   * Mutually exclusive with `range` prop
   */
  value?: number

  /**
   * Range values [min, max]
   * Mutually exclusive with `value` prop
   */
  range?: [number, number]

  /**
   * Minimum value
   * @default 0
   */
  min?: number

  /**
   * Maximum value
   * @default 100
   */
  max?: number

  /**
   * Step increment
   * @default 1
   */
  step?: number

  /**
   * Color variant
   * @default 'primary'
   */
  color?: SliderColor

  /**
   * Indicator (tooltip) position
   * @default 'top'
   */
  indicatorPosition?: SliderIndicatorPosition

  /**
   * Show indicator (tooltip)
   * If false, equivalent to indicatorPosition='none'
   * @default true
   */
  showIndicator?: boolean

  /**
   * Disabled state
   * @default false
   */
  disabled?: boolean

  /**
   * Callback when single value changes
   */
  onValueChange?: (value: number) => void

  /**
   * Callback when range changes
   */
  onRangeChange?: (range: [number, number]) => void

  /**
   * Custom style for the slider container
   */
  style?: ViewStyle

  /**
   * Custom style for the track
   */
  trackStyle?: ViewStyle

  /**
   * Custom style for the fill
   */
  fillStyle?: ViewStyle

  /**
   * Custom style for the handle
   */
  handleStyle?: ViewStyle

  /**
   * Custom style for the tooltip
   */
  tooltipStyle?: ViewStyle
}

