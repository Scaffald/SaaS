import type { ViewStyle } from 'react-native'

export interface AssessmentProgressBarProps {
  /**
   * Progress value (0-100)
   */
  value: number

  /**
   * Fill color override
   * @default colors.primary[500]
   */
  color?: string

  /**
   * Track background color override
   */
  trackColor?: string

  /**
   * Bar height in pixels
   * @default 3
   */
  height?: number

  /**
   * Whether to animate value changes
   * @default true
   */
  animated?: boolean

  /**
   * Additional container styles
   */
  style?: ViewStyle
}
