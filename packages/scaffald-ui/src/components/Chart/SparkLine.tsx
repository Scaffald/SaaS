/**
 * SparkLine component
 * Compact inline trend line for embedding in cards and lists
 *
 * @example
 * ```tsx
 * <SparkLine data={[3.2, 3.5, 3.4, 3.8, 4.0]} color="#1d7282" />
 * ```
 */

import { View } from 'react-native'
import Svg, { Path, Circle } from 'react-native-svg'
import type { SparkLineProps } from './Chart.types'
import { colors } from '../../tokens/colors'

export function SparkLine({
  data,
  trend,
  width = 64,
  height = 24,
  color,
  style,
}: SparkLineProps) {
  if (!data || data.length < 2) return null

  const resolvedTrend = trend ?? (() => {
    const first = data[0]
    const last = data[data.length - 1]
    if (last > first + 0.1) return 'up' as const
    if (last < first - 0.1) return 'down' as const
    return 'stable' as const
  })()

  const resolvedColor = color ?? (
    resolvedTrend === 'up'
      ? colors.green[500]
      : resolvedTrend === 'down'
        ? colors.error[500]
        : colors.gray[400]
  )

  const padding = 2
  const chartW = width - padding * 2
  const chartH = height - padding * 2

  const minVal = Math.min(...data)
  const maxVal = Math.max(...data)
  const range = maxVal - minVal || 1

  const points = data.map((val, i) => ({
    x: padding + (i / (data.length - 1)) * chartW,
    y: padding + chartH - ((val - minVal) / range) * chartH,
  }))

  // Build smooth path
  let path = `M ${points[0].x} ${points[0].y}`
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const curr = points[i]
    const cpx = (prev.x + curr.x) / 2
    path += ` C ${cpx} ${prev.y}, ${cpx} ${curr.y}, ${curr.x} ${curr.y}`
  }

  const lastPoint = points[points.length - 1]

  return (
    <View style={[{ width, height }, style]}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <Path
          d={path}
          fill="none"
          stroke={resolvedColor}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* End dot */}
        <Circle
          cx={lastPoint.x}
          cy={lastPoint.y}
          r={2.5}
          fill={resolvedColor}
        />
      </Svg>
    </View>
  )
}
