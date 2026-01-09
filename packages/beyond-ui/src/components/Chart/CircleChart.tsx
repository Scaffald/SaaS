/**
 * CircleChart component
 * Circular progress chart for displaying percentages
 *
 * @example
 * ```tsx
 * <CircleChart
 *   value={75}
 *   size="md"
 *   color="#3b82f6"
 *   showLabel={true}
 * />
 * ```
 */

import { View, Text } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import type { CircleChartProps } from './Chart.types'
import { getCircleChartSize } from './Chart.utils'
import { colors } from '../../tokens/colors'
import { typography } from '../../tokens/typography'

export function CircleChart({
  value,
  size = 'md',
  color = colors.primary[600],
  strokeWidth,
  showLabel = false,
  style,
}: CircleChartProps) {
  const clampedValue = Math.max(0, Math.min(100, value))
  const dimensions = getCircleChartSize(size)
  const { width, height, radius } = dimensions

  const actualStrokeWidth = strokeWidth || (radius * 0.1)
  const center = width / 2
  const circumference = 2 * Math.PI * (radius - actualStrokeWidth / 2)
  const offset = circumference - (clampedValue / 100) * circumference

  return (
    <View style={[{ width, height, alignItems: 'center', justifyContent: 'center' }, style]}>
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

      {/* Label */}
      {showLabel && (
        <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>
          <Text
            style={[
              {
                fontFamily: typography.body.fontFamily,
                fontSize: typography.body.fontSize,
                fontWeight: typography.body.fontWeight,
                lineHeight: typography.body.lineHeight,
                letterSpacing: typeof typography.body.letterSpacing === 'string' ? parseFloat(typography.body.letterSpacing) || 0 : typography.body.letterSpacing,
              },
              { color: colors.text.light.primary },
            ]}
          >
            {clampedValue}%
          </Text>
        </View>
      )}
    </View>
  )
}
