/**
 * SmallCircleChart component
 * Small circular progress indicators for status and metrics
 *
 * @example
 * ```tsx
 * <SmallCircleChart
 *   value={75}
 *   size="md"
 *   color="#3b82f6"
 * />
 * ```
 */

import { View } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import { getSmallCircleChartSize } from './Chart.utils'
import { colors } from '../../tokens/colors'
import type { SmallCircleChartProps } from './Chart.types'

export function SmallCircleChart({
  value,
  size = 'md',
  color = colors.primary[600],
  strokeWidth,
  style,
}: SmallCircleChartProps) {
  const clampedValue = Math.max(0, Math.min(100, value))
  const dimensions = getSmallCircleChartSize(size)
  const { width, height, radius } = dimensions

  const actualStrokeWidth = strokeWidth || (radius * 0.15)
  const center = width / 2
  const circumference = 2 * Math.PI * (radius - actualStrokeWidth / 2)
  const offset = circumference - (clampedValue / 100) * circumference

  return (
    <View style={[{ width, height }, style]}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Background circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius - actualStrokeWidth / 2}
          fill="none"
          stroke={colors.gray[200]}
          strokeWidth={actualStrokeWidth}
        />

        {/* Progress circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius - actualStrokeWidth / 2}
          fill="none"
          stroke={color}
          strokeWidth={actualStrokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>
    </View>
  )
}
