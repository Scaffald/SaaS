/**
 * Widget Chart component types
 * Types for widget-specific chart components
 */

import type { ViewStyle } from 'react-native'

/**
 * Chart data point for widgets
 */
export interface WidgetChartDataPoint {
  /**
   * Value
   */
  value: number

  /**
   * Optional label
   */
  label?: string

  /**
   * Optional color override
   */
  color?: string
}

/**
 * Linear Chart Widget props
 */
export interface LinearChartWidgetProps {
  /**
   * Chart data points
   */
  data: WidgetChartDataPoint[] | number[]

  /**
   * Chart variant
   * @default 'large'
   */
  variant?: 'small' | 'large'

  /**
   * Show legend
   * @default false
   */
  showLegend?: boolean

  /**
   * Chart height (optional, will use variant default if not provided)
   */
  height?: number

  /**
   * Chart width (optional, will use variant default if not provided)
   */
  width?: number

  /**
   * Custom colors
   */
  colors?: string[]

  /**
   * Custom chart style
   */
  style?: ViewStyle
}

/**
 * Circle Chart Widget props
 */
export interface CircleChartWidgetProps {
  /**
   * Progress value (0-100)
   */
  value: number

  /**
   * Chart variant
   * @default 'vertical'
   */
  variant?: 'vertical' | 'horizontal'

  /**
   * Circle color
   */
  color?: string

  /**
   * Chart size (optional)
   */
  size?: number

  /**
   * Custom chart style
   */
  style?: ViewStyle
}

/**
 * Donut Chart Widget props
 */
export interface DonutChartWidgetProps {
  /**
   * Chart data
   */
  data: Array<{ value: number; label?: string; color?: string }>

  /**
   * Chart variant
   * @default 'vertical'
   */
  variant?: 'vertical' | 'horizontal'

  /**
   * Show labels
   * @default false
   */
  showLabels?: boolean

  /**
   * Chart size (optional)
   */
  size?: number

  /**
   * Custom chart style
   */
  style?: ViewStyle
}

/**
 * Pie Chart Widget props
 */
export interface PieChartWidgetProps {
  /**
   * Chart data
   */
  data: Array<{ value: number; label?: string; color?: string }>

  /**
   * Show as half pie
   * @default false
   */
  half?: boolean

  /**
   * Show labels
   * @default false
   */
  showLabels?: boolean

  /**
   * Chart size (optional)
   */
  size?: number

  /**
   * Custom chart style
   */
  style?: ViewStyle
}
