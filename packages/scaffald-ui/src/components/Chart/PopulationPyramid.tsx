/**
 * PopulationPyramid – horizontal back-to-back bars (SVG-based, no gifted-charts).
 */

import { View, Text } from 'react-native'
import Svg, { G, Rect } from 'react-native-svg'
import type { PopulationPyramidProps } from './Chart.types'

export function PopulationPyramid({
  data,
  height = 200,
  width: widthProp = 300,
  leftBarColor = '#1B6B93',
  rightBarColor = '#4FC3F7',
  maxValue: maxValueProp,
}: PopulationPyramidProps) {
  const width = typeof widthProp === 'number' ? widthProp : 300
  const centerX = width / 2
  const rowHeight = Math.max(12, (height - 24) / data.length - 4)
  const labelWidth = 48
  const chartWidth = (width - labelWidth) / 2
  const maxVal =
    maxValueProp ??
    Math.max(
      ...data.flatMap((d) => [d.left, d.right]),
      1
    )
  const scale = chartWidth / maxVal

  return (
    <View style={{ width, height }} accessibilityRole="image" accessibilityLabel="Population pyramid">
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {data.map((item, i) => {
          const y = 4 + i * (rowHeight + 4)
          const leftW = Math.min(item.left * scale, chartWidth)
          const rightW = Math.min(item.right * scale, chartWidth)
          return (
            <G key={item.label ?? `row-${i}`}>
              <Rect
                x={centerX - leftW}
                y={y}
                width={leftW}
                height={rowHeight}
                fill={leftBarColor}
                rx={2}
                ry={2}
              />
              <Rect
                x={centerX}
                y={y}
                width={rightW}
                height={rowHeight}
                fill={rightBarColor}
                rx={2}
                ry={2}
              />
            </G>
          )
        })}
      </Svg>
      {data.some((d) => d.label) && (
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            paddingHorizontal: 4,
            marginTop: 4,
          }}
        >
          {data.map((item, i) => (
            <Text
              key={item.label ?? `lbl-${i}`}
              style={{ fontSize: 10, color: '#6b7280', width: width / Math.min(data.length, 4) }}
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
