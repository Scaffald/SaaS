/**
 * Circle Chart Widget component
 * Circular progress chart with vertical and horizontal variants
 *
 * @example
 * ```tsx
 * <CircleChart
 *   variant="vertical"
 *   value={75}
 *   color="#3b82f6"
 * />
 * ```
 */

import { View } from 'react-native'
import { CircleChart as BaseCircleChart } from '../../Chart'
import type { CircleChartWidgetProps } from './Chart.types'
import { colors } from '../../../tokens/colors'

export function CircleChart({
  value,
  variant = 'vertical',
  color = colors.primary[600],
  size,
  style,
}: CircleChartWidgetProps) {
  // Default size based on variant
  // Vertical is typically taller, horizontal is wider
  const defaultSize = variant === 'vertical' ? 'md' : 'md'
  const chartSize = size ? undefined : defaultSize

  return (
    <View style={style}>
      <BaseCircleChart
        value={value}
        size={chartSize as 'sm' | 'md' | 'lg' | 'xl' | undefined}
        color={color}
        showLabel={false}
      />
    </View>
  )
}
