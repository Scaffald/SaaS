/**
 * Donut Chart Widget component
 * Donut chart with vertical and horizontal layout variants
 *
 * @example
 * ```tsx
 * <DonutChart
 *   variant="vertical"
 *   data={[
 *     { value: 30, label: 'A', color: '#3b82f6' },
 *     { value: 50, label: 'B', color: '#10b981' },
 *   ]}
 * />
 * ```
 */

import { View } from 'react-native'
import { DonutChart as BaseDonutChart } from '../../Chart'
import type { DonutChartData } from '../../Chart/Chart.types'
import type { DonutChartWidgetProps } from './Chart.types'

export function DonutChart({
  data,
  variant = 'vertical',
  showLabels = false,
  size,
  style,
}: DonutChartWidgetProps) {
  // Convert to DonutChartData format
  const chartData: DonutChartData[] = data.map((item) => ({
    label: item.label || '',
    value: item.value,
    color: item.color,
  }))

  // Default size based on variant
  const defaultSize = variant === 'vertical' ? 'md' : 'md'

  return (
    <View style={style}>
      <BaseDonutChart
        data={chartData}
        size={size ? undefined : (defaultSize as 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2x-small' | '2x-large' | '3x-small' | undefined)}
        showLabel={showLabels}
        colorScheme="colorful"
      />
    </View>
  )
}
