/**
 * MiniLinearChart component
 * Small linear chart for dashboards and cards
 *
 * @example
 * ```tsx
 * <MiniLinearChart
 *   data={[10, 20, 15, 30, 25]}
 *   shadow={true}
 *   color="#3b82f6"
 * />
 * ```
 */

import { View } from 'react-native'
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg'
import type { MiniLinearChartProps } from './Chart.types'
import { generateLinePath } from './Chart.utils'
import { colors } from '../../tokens/colors'

export function MiniLinearChart({
  data,
  shadow = true,
  color = colors.primary[600],
  height = 59,
  width = 112,
  style,
}: MiniLinearChartProps) {
  // Convert data array to points
  const points = data.map((value, index) => ({
    x: (index / (data.length - 1 || 1)) * width,
    y: value,
  }))

  // Normalize y values to fit within height
  const maxY = Math.max(...data, 1)
  const normalizedPoints = points.map((point) => ({
    x: point.x,
    y: (point.y / maxY) * height,
  }))

  const path = generateLinePath(normalizedPoints, width, height, true)

  return (
    <View style={[{ width, height }, style]}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <Defs>
          {shadow && (
            <LinearGradient id="shadowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <Stop offset="100%" stopColor={color} stopOpacity="0" />
            </LinearGradient>
          )}
        </Defs>

        {/* Shadow area */}
        {shadow && (
          <Path
            d={`${path} L ${width} ${height} L 0 ${height} Z`}
            fill="url(#shadowGradient)"
          />
        )}

        {/* Line */}
        <Path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  )
}
