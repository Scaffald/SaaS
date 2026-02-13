/**
 * Chart component
 * Main chart component with grid, axes, and labels
 *
 * @example
 * ```tsx
 * <Chart
 *   type="linear"
 *   xAxisLabels={['Jan', 'Feb', 'Mar']}
 *   yAxisLabels={[0, 25, 50, 75, 100]}
 *   period="month"
 *   showGrid={true}
 * >
 *   <LinearChart data={chartData} />
 * </Chart>
 * ```
 */

import { View, Text } from 'react-native'
import type { ChartProps } from './Chart.types'
import { getChartStyles } from './Chart.styles'
import { getPeriodLabels } from './Chart.utils'
import { useThemeContext } from '../../theme'
import { spacing } from '../../tokens/spacing'
import { colors } from '../../tokens/colors'

export function Chart({
  xAxisLabels: customXAxisLabels,
  yAxisLabels: customYAxisLabels,
  period,
  showGrid = true,
  height = 247,
  width: widthProp = 847,
  children,
  style,
}: ChartProps) {
  const { theme } = useThemeContext()
  const styles = getChartStyles(theme)

  // Normalize width to number for calculations
  const width = typeof widthProp === 'string' ? parseFloat(widthProp) || 847 : widthProp

  // Get x-axis labels from period or custom
  const xAxisLabels =
    customXAxisLabels || (period ? getPeriodLabels(period) : [])

  // Get y-axis labels (default: 0, 20, 40, 60, 80, 100)
  const yAxisLabels = customYAxisLabels || [0, 20, 40, 60, 80, 100]
  const maxY = Math.max(...yAxisLabels, 100)

  // Grid line positions
  const gridLines = yAxisLabels.map((label) => ({
    y: ((maxY - label) / maxY) * height,
    label,
  }))

  return (
    <View style={[styles.container, { width: width as number, height }, style]}>
      {/* Chart with Grid */}
      <View style={styles.chartArea}>
        {/* Grid Lines */}
        {showGrid && (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: spacing[32] + spacing[32], // Space for y-axis labels
              right: 0,
              bottom: spacing[24], // Space for x-axis labels
            }}
          >
            {gridLines.map((gridLine, index) => (
              <View
                key={index}
                style={{
                  position: 'absolute',
                  top: gridLine.y,
                  left: 0,
                  right: 0,
                  height: 1,
                  backgroundColor: colors.border[theme].default,
                  opacity: 0.3,
                }}
              />
            ))}
          </View>
        )}

        {/* Y-Axis Labels */}
        <View
          style={{
            position: 'absolute',
            left: spacing[32],
            top: 0,
            width: spacing[32],
            height: height - spacing[24],
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            paddingRight: spacing[10],
          }}
        >
          {gridLines.map((gridLine, index) => (
            <Text
              key={index}
              style={[styles.axisLabel, { textAlign: 'right' }]}
            >
              {gridLine.label}
            </Text>
          ))}
        </View>

        {/* Chart Content */}
        <View
          style={{
            position: 'absolute',
            left: spacing[32] + spacing[32],
            top: 0,
            right: 0,
            bottom: spacing[24],
          }}
        >
          {children}
        </View>

        {/* X-Axis Labels */}
        {xAxisLabels.length > 0 && (
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: spacing[32] + spacing[32],
              right: 0,
              height: spacing[24],
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: spacing[40],
            }}
          >
            {xAxisLabels.map((label, index) => (
              <Text key={index} style={styles.axisLabel}>
                {label}
              </Text>
            ))}
          </View>
        )}
      </View>
    </View>
  )
}
