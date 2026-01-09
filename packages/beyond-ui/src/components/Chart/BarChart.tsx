/**
 * BarChart component
 * Bar chart with variant support for different bar widths and layouts
 *
 * @example
 * ```tsx
 * <BarChart
 *   data={[10, 20, 15, 30, 25]}
 *   variant="1"
 *   colors={['#3b82f6', '#10b981', '#f59e0b']}
 * />
 * ```
 */

import { View } from 'react-native'
import Svg, { Rect } from 'react-native-svg'
import type { BarChartProps } from './Chart.types'
import { normalizeData, getBarChartColors } from './Chart.utils'

export function BarChart({
  data,
  variant = '1',
  colors: customColors,
  height = 180,
  width: widthProp = 229,
  style,
}: BarChartProps) {
  // Normalize width to number for calculations
  const width = typeof widthProp === 'string' ? parseFloat(widthProp) || 229 : widthProp

  if (data.length === 0) {
    return <View style={[{ width: width as number, height }, style]} />
  }

  const chartColors = customColors || getBarChartColors(variant)
  const normalizedData = normalizeData(data, 0, height)

  // Calculate bar dimensions based on variant
  let barWidth: number
  let gap: number

  switch (variant) {
    case '1':
      // Thin bars (8px)
      barWidth = 8
      gap = (width - barWidth * data.length) / (data.length + 1)
      break
    case '2':
      // Medium bars (8px, same as variant 1 but different spacing)
      barWidth = 8
      gap = (width - barWidth * data.length) / (data.length + 1)
      break
    case '3':
      // Thick bars (28px)
      barWidth = 28
      gap = (width - barWidth * data.length) / (data.length + 1)
      break
    default:
      barWidth = 8
      gap = (width - barWidth * data.length) / (data.length + 1)
  }

  return (
    <View style={[{ width: width as number, height }, style]}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {normalizedData.map((value, index) => {
          const x = gap + index * (barWidth + gap)
          const y = height - value
          const barHeight = value

          return (
            <Rect
              key={index}
              x={x}
              y={y}
              width={barWidth}
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
