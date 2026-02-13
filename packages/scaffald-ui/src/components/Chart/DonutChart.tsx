/**
 * DonutChart component
 * Donut/pie chart with multiple size variants and color schemes
 *
 * @example
 * ```tsx
 * <DonutChart
 *   data={[
 *     { label: 'A', value: 30, color: '#3b82f6' },
 *     { label: 'B', value: 50, color: '#10b981' },
 *     { label: 'C', value: 20, color: '#f59e0b' },
 *   ]}
 *   size="md"
 *   colorScheme="primary"
 *   showLabel={true}
 * />
 * ```
 */

import { View, Text } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import type { DonutChartProps } from './Chart.types'
import { getChartSize, calculatePieAngles, getChartColors, getArcPath } from './Chart.utils'
import { colors } from '../../tokens/colors'
import { typography } from '../../tokens/typography'

export function DonutChart({
  data,
  size = 'md',
  colorScheme = 'primary',
  showLabel = false,
  showPercentage = false,
  style,
}: DonutChartProps) {
  if (data.length === 0) {
    return <View style={[{ width: 120, height: 120 }, style]} />
  }

  const dimensions = getChartSize(size)
  const { width, height } = dimensions
  const centerX = width / 2
  const centerY = height / 2
  const outerRadius = Math.min(width, height) / 2 - 10
  const innerRadius = outerRadius * 0.6 // 60% of outer radius for donut hole

  // Calculate angles and colors
  const defaultColors = getChartColors(colorScheme, data.length)
  const dataWithColors = data.map((item, index) => ({
    ...item,
    color: item.color || defaultColors[index],
  }))

  const angles = calculatePieAngles(dataWithColors)

  return (
    <View style={[{ width, height }, style]}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {angles.map((angle) => (
          <Path
            key={`angle-${angle.startAngle}-${angle.endAngle}-${angle.color}`}
            d={getArcPath(
              centerX,
              centerY,
              outerRadius,
              angle.startAngle,
              angle.endAngle,
              innerRadius
            )}
            fill={angle.color}
            stroke={colors.bg.light.default}
            strokeWidth={2}
          />
        ))}
      </Svg>

      {/* Labels */}
      {showLabel && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          {angles.map((angle) => {
            const midAngle = (angle.startAngle + angle.endAngle) / 2
            const labelRadius = (outerRadius + innerRadius) / 2
            const labelX = centerX + labelRadius * Math.cos((midAngle * Math.PI) / 180)
            const labelY = centerY + labelRadius * Math.sin((midAngle * Math.PI) / 180)

            return (
              <Text
                key={`label-${angle.startAngle}-${angle.endAngle}-${angle.color}`}
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
                {showPercentage && ` (${Math.round((angle.value / angles.reduce((sum, a) => sum + a.value, 0)) * 100)}%)`}
              </Text>
            )
          })}
        </View>
      )}
    </View>
  )
}
