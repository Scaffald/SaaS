/**
 * Pie Chart Widget component
 * Pie chart with optional half-pie variant
 *
 * @example
 * ```tsx
 * <PieChart
 *   half={false}
 *   data={[
 *     { value: 30, label: 'A', color: '#3b82f6' },
 *     { value: 50, label: 'B', color: '#10b981' },
 *   ]}
 * />
 * ```
 */

import { View } from 'react-native'
import { HalfPieChart } from '../../Chart'
import { DonutChart as BaseDonutChart } from '../../Chart'
import type { DonutChartData } from '../../Chart/Chart.types'
import type { PieChartWidgetProps } from './Chart.types'

export function PieChart({
  data,
  half = false,
  showLabels = false,
  size,
  style,
}: PieChartWidgetProps) {
  // Convert to appropriate format
  const chartData: DonutChartData[] = data.map((item) => ({
    label: item.label || '',
    value: item.value,
    color: item.color,
  }))

  if (half) {
    // Use HalfPieChart
    const values = chartData.map((d) => d.value)
    const colors = chartData.map((d) => d.color || '#3b82f6')

    return (
      <View style={style}>
        <HalfPieChart data={values} colors={colors} showLabel={showLabels} size={size ? undefined : 'md'} />
      </View>
    )
  }

  // Use DonutChart with innerRadius = 0 for full pie
  // Note: BaseDonutChart always has a hole, so we'll create a full pie variant
  // For now, use DonutChart with minimal inner radius
  return (
    <View style={style}>
      <BaseDonutChart
        data={chartData}
        size={size ? undefined : 'md'}
        showLabel={showLabels}
        colorScheme="colorful"
      />
    </View>
  )
}
