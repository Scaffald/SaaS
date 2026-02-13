/**
 * HalfPieChart component
 * Half pie chart with multiple size variants
 *
 * @example
 * ```tsx
 * <HalfPieChart
 *   data={[30, 50, 20]}
 *   size="md"
 *   colors={['#3b82f6', '#10b981', '#f59e0b']}
 * />
 * ```
 */

import { View, Text } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import type { HalfPieChartProps } from './Chart.types'
import { getHalfPieChartSize, calculatePieAngles, getChartColors, getArcPath } from './Chart.utils'
import { colors } from '../../tokens/colors'
import { typography } from '../../tokens/typography'

export function HalfPieChart({
  data,
  size = 'md',
  colors: customColors,
  showLabel = false,
  style,
}: HalfPieChartProps) {
  if (data.length === 0) {
    return <View style={[{ width: 124, height: 62 }, style]} />
  }

  const dimensions = getHalfPieChartSize(size)
  const { width, height, radius } = dimensions
  const centerX = width / 2
  const centerY = height // Center at bottom for half pie

  const chartColors = customColors || getChartColors('colorful', data.length)

  // Convert data to DonutChartData format
  const donutData = data.map((value, index) => ({
    label: `Segment ${index + 1}`,
    value,
    color: chartColors[index],
  }))

  const angles = calculatePieAngles(donutData)

  // Filter angles to only show top half (0 to 180 degrees)
  const halfAngles = angles.map((angle) => {
    // Clamp angles to top half
    const startAngle = Math.max(-90, Math.min(90, angle.startAngle))
    const endAngle = Math.max(-90, Math.min(90, angle.endAngle))

    return {
      ...angle,
      startAngle,
      endAngle,
    }
  })

  return (
    <View style={[{ width, height }, style]}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {halfAngles.map((angle, index) => {
          if (angle.startAngle >= angle.endAngle) return null

          return (
            <Path
              key={index}
              d={getArcPath(
                centerX,
                centerY,
                radius,
                angle.startAngle,
                angle.endAngle,
                0 // No inner radius for half pie
              )}
              fill={angle.color}
              stroke={colors.bg.light.default}
              strokeWidth={2}
            />
          )
        })}
      </Svg>

      {/* Labels */}
      {showLabel && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          {halfAngles.map((angle, index) => {
            if (angle.startAngle >= angle.endAngle) return null

            const midAngle = (angle.startAngle + angle.endAngle) / 2
            const labelRadius = radius * 0.7
            const labelX = centerX + labelRadius * Math.cos((midAngle * Math.PI) / 180)
            const labelY = centerY + labelRadius * Math.sin((midAngle * Math.PI) / 180)

            return (
              <Text
                key={index}
                style={[
                  {
                    fontFamily: typography.caption.fontFamily,
                    fontSize: typography.caption.fontSize,
                    fontWeight: typography.caption.fontWeight,
                    lineHeight: typography.caption.lineHeight,
                    letterSpacing: typeof typography.caption.letterSpacing === 'string' ? parseFloat(typography.caption.letterSpacing) || 0 : typography.caption.letterSpacing,
                  },
                  {
                    position: 'absolute',
                    left: labelX,
                    top: labelY,
                    transform: [{ translateX: -10 }, { translateY: -8 }],
                    color: colors.text.light.primary,
                  },
                ]}
              >
                {angle.label}
              </Text>
            )
          })}
        </View>
      )}
    </View>
  )
}
