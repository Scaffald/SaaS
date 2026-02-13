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
  color = colors.primary[600],
  height = 247,
  width: widthProp = 847,
  showShadow = false,
  sharpen = false,
  series,
  data,
  style,
}: LinearChartProps) {
  // Normalize width to number for calculations
  const width = typeof widthProp === 'string' ? parseFloat(widthProp) || 847 : widthProp

  // Use series if provided, otherwise use single data array
  const chartSeries = series || (data ? [{ name: 'default', data, color }] : [])

  if (chartSeries.length === 0) {
    return <View style={[{ width: width as number, height }, style]} />
  }

  // Get all Y values across all series for normalization
  const allYValues: number[] = []
  chartSeries.forEach((s) => {
    s.data.forEach((p) => {
      const yValue = typeof p === 'object' ? p.y : p
      allYValues.push(yValue)
    })
  })

  const maxY = Math.max(...allYValues, 1)
  const minY = Math.min(...allYValues, 0)
  const yRange = maxY - minY || 1

  // Generate paths for each series
  const seriesPaths = chartSeries.map((s) => {
    // Convert data points to coordinates
    const points = s.data.map((point, index) => {
      const xValue = typeof point === 'object' ? point.x : index
      const yValue = typeof point === 'object' ? point.y : point
      
      // Normalize X to index if not numeric
      const normalizedX = typeof xValue === 'string' 
        ? parseFloat(xValue) || index 
        : (typeof xValue === 'number' ? xValue : index)
      
      // Normalize Y to chart height
      const normalizedY = height - ((yValue - minY) / yRange) * height
      
      return { x: normalizedX, y: normalizedY }
    })

    // Normalize X values to fit width (0 to width)
    const xValues = points.map((p) => p.x)
    const minX = Math.min(...xValues)
    const maxX = Math.max(...xValues) || 1
    const xRange = maxX - minX || 1
    
    const normalizedPoints = points.map((p) => ({
      x: ((p.x - minX) / xRange) * width,
      y: p.y,
    }))

    return {
      path: generateLinePath(normalizedPoints, width, height, !sharpen),
      color: s.color || color,
    }
  })

  return (
    <View style={[{ width: width as number, height }, style]}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <Defs>
          {showShadow && seriesPaths.map((_, index) => (
            <LinearGradient
              key={`shadow-${index}`}
              id={`linearShadowGradient-${index}`}
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <Stop offset="0%" stopColor={seriesPaths[index].color} stopOpacity="0.3" />
              <Stop offset="100%" stopColor={seriesPaths[index].color} stopOpacity="0" />
            </LinearGradient>
          ))}
        </Defs>

        {/* Shadow areas for each series */}
        {showShadow && seriesPaths.map((seriesPath, index) => (
          <Path
            key={`shadow-${index}`}
            d={`${seriesPath.path} L ${width} ${height} L 0 ${height} Z`}
            fill={`url(#linearShadowGradient-${index})`}
          />
        ))}

        {/* Lines for each series */}
        {seriesPaths.map((seriesPath, index) => (
          <Path
            key={`line-${index}`}
            d={seriesPath.path}
            fill="none"
            stroke={seriesPath.color}
            strokeWidth={sharpen ? '3' : '2'}
            strokeLinecap="round"
            strokeLinejoin={sharpen ? 'miter' : 'round'}
          />
        ))}
      </Svg>
    </View>
  )
}
