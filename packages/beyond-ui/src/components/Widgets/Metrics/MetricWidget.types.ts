/**
 * Metric Widget component types
 */

import type { ViewStyle } from 'react-native'

/**
 * Metric widget type variant
 */
export type MetricWidgetType =
  | 'Chart 01'
  | 'Chart 02'
  | 'Chart 03'
  | 'Blank 01'
  | 'Blank 02'
  | 'Blank 03'
  | 'Info 01'
  | 'Info 02'
  | 'Neutral'
  | 'Type10'

/**
 * Change type for metrics
 */
export type MetricChangeType = 'positive' | 'negative' | 'neutral'

/**
 * Metric Widget props
 */
export interface MetricWidgetProps {
  /**
   * Widget type variant
   * @default 'Chart 01'
   */
  type?: MetricWidgetType

  /**
   * Widget title
   */
  title: string

  /**
   * Primary numeric value
   */
  value: number | string

  /**
   * Change value (e.g., "+12%" or "-5%")
   */
  change?: string

  /**
   * Change type (determines color)
   * @default 'neutral'
   */
  changeType?: MetricChangeType

  /**
   * Subtitle/secondary text
   */
  subtitle?: string

  /**
   * Chart data (for chart variants)
   */
  chartData?: number[]

  /**
   * Chart type (for chart variants)
   * @default 'linear'
   */
  chartType?: 'linear'

  /**
   * Custom container style
   */
  style?: ViewStyle
}
