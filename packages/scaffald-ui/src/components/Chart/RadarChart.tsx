/**
 * RadarChart component
 * Spider/radar chart for displaying multi-axis skill profiles
 *
 * @example
 * ```tsx
 * <RadarChart
 *   axes={[
 *     { label: 'Reliability', value: 3.8 },
 *     { label: 'Collaboration', value: 4.1 },
 *     { label: 'Professionalism', value: 3.5 },
 *     { label: 'Technical', value: 4.0 },
 *   ]}
 *   comparison={[
 *     { label: 'Reliability', value: 3.2 },
 *     { label: 'Collaboration', value: 4.5 },
 *   ]}
 *   size="md"
 *   showLabels
 *   showValues
 * />
 * ```
 */

import { View, Text } from 'react-native'
import Svg, { Polygon, Line, Circle, Path, Defs, LinearGradient, Stop } from 'react-native-svg'
import type { RadarChartProps } from './Chart.types'
import { colors } from '../../tokens/colors'
import { typography } from '../../tokens/typography'
import { degreesToRadians } from './Chart.utils'

const RADAR_SIZES = {
  sm: { diameter: 160, labelOffset: 20 },
  md: { diameter: 240, labelOffset: 28 },
  lg: { diameter: 320, labelOffset: 34 },
} as const

const RING_COUNT = 5

function getPointOnCircle(
  cx: number,
  cy: number,
  radius: number,
  angleIndex: number,
  totalAxes: number
): { x: number; y: number } {
  const angle = degreesToRadians((360 / totalAxes) * angleIndex - 90)
  return {
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  }
}

function buildPolygonPoints(
  cx: number,
  cy: number,
  radius: number,
  count: number
): string {
  return Array.from({ length: count }, (_, i) => {
    const pt = getPointOnCircle(cx, cy, radius, i, count)
    return `${pt.x},${pt.y}`
  }).join(' ')
}

function buildDataPath(
  cx: number,
  cy: number,
  maxRadius: number,
  values: number[],
  maxValue: number,
  count: number
): string {
  const points = values.map((val, i) => {
    const r = (Math.min(val, maxValue) / maxValue) * maxRadius
    return getPointOnCircle(cx, cy, r, i, count)
  })
  if (points.length === 0) return ''
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z'
}

export function RadarChart({
  axes,
  comparison,
  size = 'md',
  colorScheme = 'primary',
  showLabels = true,
  showValues = false,
  style,
}: RadarChartProps) {
  if (!axes || axes.length < 3) return null

  const config = RADAR_SIZES[size]
  const labelSpace = showLabels ? config.labelOffset : 0
  const svgSize = config.diameter + labelSpace * 2
  const cx = svgSize / 2
  const cy = svgSize / 2
  const maxRadius = config.diameter / 2
  const count = axes.length
  const maxValue = axes[0]?.maxValue ?? 5

  const primaryColor = colorScheme === 'primary' ? colors.primary[500] : colors.blue[500]
  const comparisonColor = colors.orange[500]
  const gridColor = colors.gray[300]
  const labelColor = colors.text.light.primary

  const primaryValues = axes.map((a) => a.value)
  const primaryPath = buildDataPath(cx, cy, maxRadius, primaryValues, maxValue, count)

  const comparisonPath = comparison
    ? buildDataPath(cx, cy, maxRadius, comparison.map((c) => c.value), maxValue, count)
    : null

  return (
    <View style={[{ width: svgSize, height: svgSize, alignItems: 'center', justifyContent: 'center' }, style]}>
      <Svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`}>
        <Defs>
          <LinearGradient id="radarFill" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={primaryColor} stopOpacity="0.35" />
            <Stop offset="100%" stopColor={primaryColor} stopOpacity="0.1" />
          </LinearGradient>
          {comparisonPath && (
            <LinearGradient id="radarCompFill" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={comparisonColor} stopOpacity="0.2" />
              <Stop offset="100%" stopColor={comparisonColor} stopOpacity="0.05" />
            </LinearGradient>
          )}
        </Defs>

        {/* Concentric polygon rings */}
        {Array.from({ length: RING_COUNT }, (_, i) => {
          const ringRadius = (maxRadius / RING_COUNT) * (i + 1)
          return (
            <Polygon
              key={`ring-${i}`}
              points={buildPolygonPoints(cx, cy, ringRadius, count)}
              fill="none"
              stroke={gridColor}
              strokeWidth={i === RING_COUNT - 1 ? 1 : 0.5}
              strokeOpacity={0.5}
            />
          )
        })}

        {/* Axis lines from center to each vertex */}
        {axes.map((_, i) => {
          const pt = getPointOnCircle(cx, cy, maxRadius, i, count)
          return (
            <Line
              key={`axis-${i}`}
              x1={cx}
              y1={cy}
              x2={pt.x}
              y2={pt.y}
              stroke={gridColor}
              strokeWidth={0.5}
              strokeOpacity={0.5}
            />
          )
        })}

        {/* Comparison data area (behind primary) */}
        {comparisonPath && (
          <>
            <Path
              d={comparisonPath}
              fill="url(#radarCompFill)"
              stroke={comparisonColor}
              strokeWidth={1.5}
              strokeDasharray="4,3"
              strokeOpacity={0.8}
            />
            {/* Comparison data points */}
            {comparison!.map((c, i) => {
              const r = (Math.min(c.value, maxValue) / maxValue) * maxRadius
              const pt = getPointOnCircle(cx, cy, r, i, count)
              return (
                <Circle
                  key={`comp-dot-${i}`}
                  cx={pt.x}
                  cy={pt.y}
                  r={3}
                  fill={comparisonColor}
                  strokeWidth={1}
                  stroke="white"
                />
              )
            })}
          </>
        )}

        {/* Primary data area */}
        <Path
          d={primaryPath}
          fill="url(#radarFill)"
          stroke={primaryColor}
          strokeWidth={2}
          strokeLinejoin="round"
        />

        {/* Primary data points */}
        {primaryValues.map((val, i) => {
          const r = (Math.min(val, maxValue) / maxValue) * maxRadius
          const pt = getPointOnCircle(cx, cy, r, i, count)
          return (
            <Circle
              key={`dot-${i}`}
              cx={pt.x}
              cy={pt.y}
              r={4}
              fill={primaryColor}
              strokeWidth={2}
              stroke="white"
            />
          )
        })}
      </Svg>

      {/* Labels positioned outside the chart */}
      {showLabels &&
        axes.map((axis, i) => {
          const labelRadius = maxRadius + config.labelOffset
          const pt = getPointOnCircle(cx, cy, labelRadius, i, count)

          const isLeft = pt.x < cx - 5
          const isRight = pt.x > cx + 5
          const isTop = pt.y < cy - 5

          return (
            <View
              key={`label-${i}`}
              style={{
                position: 'absolute',
                left: pt.x - 50,
                top: pt.y - (showValues ? 16 : 8),
                width: 100,
                alignItems: isLeft ? 'flex-end' : isRight ? 'flex-start' : 'center',
              }}
            >
              <Text
                style={{
                  fontFamily: typography.caption.fontFamily,
                  fontSize: size === 'sm' ? 9 : 11,
                  fontWeight: '600',
                  color: labelColor,
                  textAlign: isLeft ? 'right' : isRight ? 'left' : 'center',
                }}
                numberOfLines={1}
              >
                {axis.label}
              </Text>
              {showValues && (
                <Text
                  style={{
                    fontFamily: typography.caption.fontFamily,
                    fontSize: size === 'sm' ? 8 : 10,
                    color: colors.text.light.tertiary,
                    textAlign: isLeft ? 'right' : isRight ? 'left' : 'center',
                  }}
                >
                  {axis.value.toFixed(1)}
                </Text>
              )}
            </View>
          )
        })}
    </View>
  )
}
