/**
 * LinearChart component
 * Line chart with period support and optional sharpen variant
 *
 * @example
 * ```tsx
 * <LinearChart
 *   data={[
 *     { x: 0, y: 10 },
 *     { x: 1, y: 20 },
 *     { x: 2, y: 15 },
 *   ]}
 *   period="month"
 *   color="#3b82f6"
 *   showShadow={false}
 * />
 * ```
 */

import { View } from 'react-native'
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg'
import type { LinearChartProps } from './Chart.types'
import { generateLinePath, normalizeData } from './Chart.utils'
import { colors } from '../../tokens/colors'

export function LinearChart({
  data,
  period,
  color = colors.primary[600],
  height = 247,
  width = 847,
  showShadow = false,
  sharpen = false,
  series,
  style,
}: LinearChartProps) {
  // Use series if provided, otherwise use single data array
  const chartSeries = series || (data ? [{ name: 'default', data, color }] : [])

  if (chartSeries.length === 0) {
    return <View style={[{ width, height }, style]} />
  }

  // Get all data points for normalization
  const allPoints = chartSeries.flatMap((s) => s.data)
  const allYValues = allPoints.map((p) => (typeof p === 'object' ? p.y : p))
  const normalizedYValues = normalizeData(allYValues, 0, height)

  // Convert to points with normalized y values
  const normalizedPoints = allPoints.map((point, index) => {
    const pointIndex = allYValues.indexOf(typeof point === 'object' ? point.y : point)
    return {
      x: typeof point === 'object' ? point.x : pointIndex,
      y: normalizedYValues[pointIndex] || 0,
    }
  })

  const path = generateLinePath(normalizedPoints, width, height, !sharpen)

  return (
    <View style={[{ width, height }, style]}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <Defs>
          {showShadow && (
            <LinearGradient id="linearShadowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <Stop offset="100%" stopColor={color} stopOpacity="0" />
            </LinearGradient>
          )}
        </Defs>

        {/* Shadow area */}
        {showShadow && (
          <Path
            d={`${path} L ${width} ${height} L 0 ${height} Z`}
            fill="url(#linearShadowGradient)"
          />
        )}

        {/* Line */}
        <Path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth={sharpen ? '3' : '2'}
          strokeLinecap="round"
          strokeLinejoin={sharpen ? 'miter' : 'round'}
        />
      </Svg>
    </View>
  )
}
