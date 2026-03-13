/**
 * Chart component types
 * Mapped from Figma Forsured Design System Chart components
 */

import type { ViewStyle } from 'react-native'

/**
 * Chart period/timeframe
 */
export type ChartPeriod = 'week' | 'month' | 'year' | 'last-days'

/**
 * Chart time period type for X-axis labels
 */
export type ChartTimePeriodType =
  | 'Value'
  | 'Period - Week'
  | 'Period - Month 01'
  | 'Period - Month 02'
  | 'Period - Last Days'
  | 'Period - Year'

/**
 * Chart size variants
 */
export type ChartSize =
  | '3x-small'
  | '2x-small'
  | 'xs'
  | 'sm'
  | 'md'
  | 'lg'
  | 'xl'
  | '2x-large'

/**
 * Extended chart size for circle charts
 */
export type CircleChartSize = 'sm' | 'md' | 'lg' | 'xl'

/**
 * Half pie chart size
 */
export type HalfPieChartSize = 'sm' | 'md' | 'lg'

/**
 * Chart color scheme
 */
export type ChartColorScheme = 'primary' | 'colorful'

/**
 * Chart data point
 */
export interface ChartDataPoint {
  /**
   * X-axis value (label or number)
   */
  x: string | number

  /**
   * Y-axis value
   */
  y: number

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
 * Chart series data
 */
export interface ChartSeries {
  /**
   * Series name/label
   */
  name: string

  /**
   * Data points for this series
   */
  data: ChartDataPoint[]

  /**
   * Series color
   */
  color?: string
}

/**
 * Donut chart data item
 */
export interface DonutChartData {
  /**
   * Item label
   */
  label: string

  /**
   * Item value
   */
  value: number

  /**
   * Item color
   */
  color?: string
}

/**
 * BarChart props
 */
export interface BarChartProps {
  /**
   * Data values (array of numbers)
   */
  data: number[]

  /**
   * Bar variant (width/layout)
   * @default '1'
   */
  variant?: '1' | '2' | '3'

  /**
   * Custom colors for bars
   */
  colors?: string[]

  /**
   * Chart height
   */
  height?: number

  /**
   * Chart width
   */
  width?: number | string

  /**
   * Custom chart style
   */
  style?: ViewStyle
}

/**
 * BarChartBase props
 */
export interface BarChartBaseProps extends Omit<BarChartProps, 'variant'> {
  /**
   * Time period variant
   */
  period?: ChartPeriod

  /**
   * Multiple series support
   */
  series?: ChartSeries[]
}

/**
 * LinearChart props
 */
export interface LinearChartProps {
  /**
   * Data points for line chart
   */
  data: ChartDataPoint[]

  /**
   * Time period variant
   */
  period?: ChartPeriod

  /**
   * Line color
   */
  color?: string

  /**
   * Chart height
   */
  height?: number

  /**
   * Chart width
   */
  width?: number | string

  /**
   * Show shadow under line
   * @default false
   */
  showShadow?: boolean

  /**
   * Sharpen variant (different line style)
   * @default false
   */
  sharpen?: boolean

  /**
   * Multiple series support
   */
  series?: ChartSeries[]

  /**
   * Custom chart style
   */
  style?: ViewStyle
}

/**
 * DonutChart props
 */
export interface DonutChartProps {
  /**
   * Data for donut chart
   */
  data: DonutChartData[]

  /**
   * Chart size
   * @default 'md'
   */
  size?: ChartSize

  /**
   * Color scheme
   * @default 'primary'
   */
  colorScheme?: ChartColorScheme

  /**
   * Show labels
   * @default false
   */
  showLabel?: boolean

  /**
   * Show percentage values
   * @default false
   */
  showPercentage?: boolean

  /**
   * Custom chart style
   */
  style?: ViewStyle
}

/**
 * CircleChart props
 */
export interface CircleChartProps {
  /**
   * Progress value (0-100)
   */
  value: number

  /**
   * Chart size
   * @default 'md'
   */
  size?: CircleChartSize

  /**
   * Circle color
   */
  color?: string

  /**
   * Stroke width
   */
  strokeWidth?: number

  /**
   * Show label with value
   * @default false
   */
  showLabel?: boolean

  /**
   * Custom chart style
   */
  style?: ViewStyle
}

/**
 * HalfPieChart props
 */
export interface HalfPieChartProps {
  /**
   * Data values
   */
  data: number[]

  /**
   * Chart size
   * @default 'md'
   */
  size?: HalfPieChartSize

  /**
   * Custom colors
   */
  colors?: string[]

  /**
   * Show labels
   * @default false
   */
  showLabel?: boolean

  /**
   * Custom chart style
   */
  style?: ViewStyle
}

/**
 * MiniLinearChart props
 */
export interface MiniLinearChartProps {
  /**
   * Data values (array of y values)
   */
  data: number[]

  /**
   * Show shadow
   * @default true
   */
  shadow?: boolean

  /**
   * Line color
   */
  color?: string

  /**
   * Chart height
   * @default 59
   */
  height?: number

  /**
   * Chart width
   * @default 112
   */
  width?: number

  /**
   * Custom chart style
   */
  style?: ViewStyle
}

/**
 * SmallCircleChart props
 */
export interface SmallCircleChartProps {
  /**
   * Progress value (0-100)
   */
  value: number

  /**
   * Chart size
   * @default 'md'
   */
  size?: ChartSize

  /**
   * Circle color
   */
  color?: string

  /**
   * Stroke width
   */
  strokeWidth?: number

  /**
   * Custom chart style
   */
  style?: ViewStyle
}

/**
 * Stacked bar chart stack segment
 */
export interface StackedBarChartStack {
  value: number
  color?: string
  label?: string
}

/**
 * Stacked bar chart data item (one bar = multiple stacked segments)
 */
export interface StackedBarChartData {
  stacks: StackedBarChartStack[]
  label?: string
}

/**
 * StackedBarChart props (SVG-based, no gifted-charts)
 */
export interface StackedBarChartProps {
  data: StackedBarChartData[]
  height?: number
  width?: number
  barWidth?: number
  spacing?: number
  maxValue?: number
  colors?: string[]
}

/**
 * Population pyramid data item (one row: left and right values)
 */
export interface PopulationPyramidData {
  left: number
  right: number
  label?: string
}

/**
 * PopulationPyramid props (SVG-based, no gifted-charts)
 */
export interface PopulationPyramidProps {
  data: PopulationPyramidData[]
  height?: number
  width?: number
  leftBarColor?: string
  rightBarColor?: string
  maxValue?: number
}

/**
 * Radar chart axis definition
 */
export interface RadarChartAxis {
  /**
   * Axis label text
   */
  label: string

  /**
   * Current value on this axis
   */
  value: number

  /**
   * Maximum value for this axis (defaults to 5)
   * @default 5
   */
  maxValue?: number
}

/**
 * RadarChart props
 */
export interface RadarChartProps {
  /**
   * Axes definitions with labels and values
   * Minimum 3 axes required
   */
  axes: RadarChartAxis[]

  /**
   * Optional second dataset for overlay comparison (e.g. peer vs self)
   */
  comparison?: Array<{ label: string; value: number }>

  /**
   * Chart size
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg'

  /**
   * Color scheme
   * @default 'primary'
   */
  colorScheme?: ChartColorScheme

  /**
   * Show axis labels outside the chart
   * @default true
   */
  showLabels?: boolean

  /**
   * Show numeric values next to labels
   * @default false
   */
  showValues?: boolean

  /**
   * Custom chart style
   */
  style?: ViewStyle
}

/**
 * SparkLine props
 */
export interface SparkLineProps {
  /**
   * Sequential data values
   */
  data: number[]

  /**
   * Optional trend override
   */
  trend?: 'up' | 'down' | 'stable'

  /**
   * Chart width
   * @default 64
   */
  width?: number

  /**
   * Chart height
   * @default 24
   */
  height?: number

  /**
   * Line color (auto-selected based on trend if omitted)
   */
  color?: string

  /**
   * Custom style
   */
  style?: ViewStyle
}

/**
 * DeltaBadge props
 */
export interface DeltaBadgeProps {
  /**
   * Current value
   */
  current: number

  /**
   * Previous value to compare against
   */
  previous: number

  /**
   * Display format
   * - 'absolute': raw difference (e.g. +0.8)
   * - 'percentage': percentage change (e.g. +15%)
   * - 'rating': fixed decimal for ratings (e.g. +0.4)
   * @default 'absolute'
   */
  format?: 'absolute' | 'percentage' | 'rating'

  /**
   * Badge size
   * @default 'sm'
   */
  size?: 'sm' | 'md'

  /**
   * Custom style
   */
  style?: ViewStyle
}

/**
 * ProgressRing props
 */
export interface ProgressRingProps {
  /**
   * Progress value (0-100)
   */
  value: number

  /**
   * Label text below the percentage
   */
  label?: string

  /**
   * Ring size
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg'

  /**
   * Ring color
   */
  color?: string

  /**
   * Custom style
   */
  style?: ViewStyle
}

/**
 * Chart component props (main chart with grid and axes)
 */
export interface ChartProps {
  /**
   * Chart type
   */
  type?: 'linear' | 'bar'

  /**
   * Chart data
   */
  data?: ChartDataPoint[] | ChartSeries[]

  /**
   * X-axis labels
   */
  xAxisLabels?: string[]

  /**
   * Y-axis labels/values
   */
  yAxisLabels?: number[]

  /**
   * Time period
   */
  period?: ChartPeriod

  /**
   * Show grid
   * @default true
   */
  showGrid?: boolean

  /**
   * Show X-axis indicator
   * @default true
   */
  showXIndicator?: boolean

  /**
   * Chart height
   */
  height?: number

  /**
   * Chart width
   */
  width?: number | string

  /**
   * Chart content (children)
   */
  children?: React.ReactNode

  /**
   * Custom chart style
   */
  style?: ViewStyle
}

/**
 * ChartTimePeriod props
 */
export interface ChartTimePeriodProps {
  /**
   * Period type for X-axis labels
   * @default 'Value'
   */
  type?: ChartTimePeriodType

  /**
   * Show number label (for Value type)
   * @default true
   */
  showNumber?: boolean

  /**
   * Custom style
   */
  style?: ViewStyle
}

/**
 * ChartGrid props
 */
export interface ChartGridProps {
  /**
   * Y-axis labels/values
   * @default [0, 20, 40, 60, 80, 100]
   */
  yAxisLabels?: number[]

  /**
   * Grid height
   * @default 247
   */
  height?: number

  /**
   * Show X-axis indicator
   * @default true
   */
  showXIndicator?: boolean

  /**
   * Time period for X-axis labels
   */
  period?: ChartPeriod

  /**
   * Custom style
   */
  style?: ViewStyle
}

/**
 * Chart style configuration
 */
export interface ChartStyleConfig {
  container: ViewStyle
  grid: ViewStyle
  axis: ViewStyle
  axisLabel: ViewStyle
  chartArea: ViewStyle
}
