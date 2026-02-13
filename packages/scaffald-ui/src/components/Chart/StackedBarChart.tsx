/**
 * StackedBarChart – stacked horizontal bars with SVG (no gifted-charts).
 */

import { View, Text } from 'react-native'
import Svg, { G, Rect } from 'react-native-svg'
import type { StackedBarChartProps } from './Chart.types'

const DEFAULT_COLORS = ['#1B6B93', '#4FC3F7', '#A8E6CF', '#3b82f6']

export function StackedBarChart({
  data,
  height = 200,
  width: widthProp = 300,
  barWidth = 24,
  spacing = 8,
  maxValue: maxValueProp,
  colors = DEFAULT_COLORS,
}: StackedBarChartProps) {
  const width = typeof widthProp === 'number' ? widthProp : 300
  const chartHeight = height - 28
  const barAreaHeight = chartHeight

  const allStackSums = data.map((d) => d.stacks.reduce((s, t) => s + t.value, 0))
  const maxSum = maxValueProp ?? Math.max(...allStackSums, 1)

  const barTotalWidth = data.length * barWidth + (data.length - 1) * spacing
  const startX = (width - barTotalWidth) / 2 + barWidth / 2 + spacing / 2

  return (
    <View style={{ width, height }} accessibilityRole="image" accessibilityLabel="Stacked bar chart">
      <Svg width={width} height={chartHeight} viewBox={`0 0 ${width} ${chartHeight}`}>
        {data.map((item, i) => {
          const x = startX + i * (barWidth + spacing) - barWidth / 2
          let offset = 0
          const total = item.stacks.reduce((s, t) => s + t.value, 0)
          const scale = total > 0 ? barAreaHeight / maxSum : 0

          return (
            <G key={item.label ?? `bar-${i}`}>
              {item.stacks.map((stack, j) => {
                const segHeight = stack.value * scale
                const y = barAreaHeight - offset - segHeight
                offset += segHeight
                const color =
                  stack.color ?? colors[j % colors.length] ?? DEFAULT_COLORS[j % DEFAULT_COLORS.length]
                return (
                  <Rect
                    key={stack.label ?? `seg-${i}-${j}`}
                    x={x}
                    y={y}
                    width={barWidth}
                    height={Math.max(0, segHeight)}
                    fill={color}
                    rx={2}
                    ry={2}
                  />
                )
              })}
            </G>
          )
        })}
      </Svg>
      {data.some((d) => d.label) && (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            paddingHorizontal: 8,
            marginTop: 6,
          }}
        >
          {data.map((item, i) => (
            <Text
              key={item.label ?? `label-${i}`}
              style={{ fontSize: 10, color: '#6b7280', flex: 1, textAlign: 'center' }}
              numberOfLines={1}
            >
              {item.label ?? ''}
            </Text>
          ))}
        </View>
      )}
    </View>
  )
}
