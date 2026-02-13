/**
 * Linear Chart Widget component
 * Line chart for widgets with small and large variants
 *
 * @example
 * ```tsx
 * <LinearChart
 *   variant="large"
 *   data={[10, 20, 15, 30, 25]}
 *   showLegend={true}
 * />
 * ```
 */

import { View } from 'react-native'
import { LinearChart as BaseLinearChart } from '../../Chart'
import type { ChartDataPoint } from '../../Chart/Chart.types'
import type { LinearChartWidgetProps } from './Chart.types'
import { LegendIndicator } from '../LegendIndicator'
import { colors } from '../../../tokens/colors'

export function LinearChart({
  data,
  variant = 'large',
  showLegend = false,
  height,
  width,
  colors: customColors,
  style,
}: LinearChartWidgetProps) {
  // Convert data to ChartDataPoint format
  const chartData: ChartDataPoint[] = Array.isArray(data) && typeof data[0] === 'number'
    ? data.map((value, index) => ({ x: index, y: value }))
    : (data as Array<{ value: number; label?: string; color?: string }>).map((item, index) => ({
        x: index,
        y: item.value,
        label: item.label,
        color: item.color,
      }))

  // Default dimensions based on variant
  const defaultHeight = variant === 'small' ? 383 : 439
  const defaultWidth = variant === 'small' ? 552 : 1128

  const chartHeight = height ?? defaultHeight
  const chartWidth = width ?? defaultWidth

  // Extract colors from data if available
  const lineColors = customColors || chartData.map((d) => d.color || colors.primary[600])

  // Prepare series if multiple colors
  const series = lineColors.length > 1
    ? [
        {
          name: 'series1',
          data: chartData,
          color: lineColors[0] || colors.primary[600],
        },
      ]
    : undefined

  // Legend items if needed
  const legendItems = showLegend
    ? chartData
        .filter((d) => d.label)
        .map((d, index) => ({
          label: d.label || `Series ${index + 1}`,
          color: lineColors[index] || colors.primary[600],
        }))
    : []

  return (
    <View style={style}>
      <BaseLinearChart
        data={chartData}
        color={lineColors[0] || colors.primary[600]}
        height={chartHeight}
        width={chartWidth}
        showShadow={variant === 'large'}
        series={series}
      />
      {showLegend && legendItems.length > 0 && (
        <LegendIndicator items={legendItems} orientation="horizontal" />
      )}
    </View>
  )
}
