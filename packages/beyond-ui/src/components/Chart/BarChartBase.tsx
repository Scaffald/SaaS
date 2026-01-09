/**
 * BarChartBase component
 * Base bar chart implementation with flexible configuration
 *
 * @example
 * ```tsx
 * <BarChartBase
 *   data={[10, 20, 15, 30, 25]}
 *   period="month"
 *   colors={['#3b82f6', '#10b981', '#f59e0b']}
 * />
 * ```
 */

import { View } from 'react-native'
import Svg, { Rect } from 'react-native-svg'
import type { BarChartBaseProps } from './Chart.types'
import { normalizeData, getBarChartColors } from './Chart.utils'
import { colors } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'

export function BarChartBase({
  data,
  period,
  colors: customColors,
  height = 180,
  width = 229,
  style,
}: BarChartBaseProps) {
  if (data.length === 0) {
    return <View style={[{ width, height }, style]} />
  }

  const chartColors = customColors || getBarChartColors('1')
  const normalizedData = normalizeData(data, 0, height)
  const barWidth = width / data.length
  const gap = barWidth * 0.2 // 20% gap between bars

  return (
    <View style={[{ width, height }, style]}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {normalizedData.map((value, index) => {
          const x = index * barWidth + gap / 2
          const barActualWidth = barWidth - gap
          const y = height - value
          const barHeight = value

          return (
            <Rect
              key={index}
              x={x}
              y={y}
              width={barActualWidth}
              height={barHeight}
              fill={chartColors[index % chartColors.length]}
              rx={999} // Fully rounded
            />
          )
        })}
      </Svg>
    </View>
  )
}
