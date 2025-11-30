import { type FC, useEffect, useMemo, useState } from 'react'
import { useWindowDimensions } from 'react-native'
import Animated, { useAnimatedProps, useSharedValue, withSpring } from 'react-native-reanimated'
import {
  Circle,
  Defs,
  G,
  LinearGradient,
  Polygon,
  Stop,
  Svg,
  Text as SvgText,
  type TextAnchor,
} from 'react-native-svg'
import { type GetThemeValueForKey, useTheme, View, Text } from 'tamagui'

// Data interfaces
export interface SkillsChartDataItem {
  label: string
  value: number
  fullMark?: number
}

export interface SkillsChartDataset {
  label: string
  data: SkillsChartDataItem[]
  fillColor?: string | GetThemeValueForKey<'backgroundColor'>
  strokeColor?: string | GetThemeValueForKey<'borderColor'>
  strokeWidth?: number
  fillOpacity?: number
  gradient?: {
    startColor: string
    endColor: string
  }
}

export interface SkillsChartProps {
  datasets: SkillsChartDataset[]
  showSets?: number[]
  height?: number
  width?: number
  radius?: number
  maxValue?: number
  bg?: GetThemeValueForKey<'backgroundColor'>
  gridColor?: string
  labelColor?: string
  labelTextSize?: number
  isAnimated?: boolean
  showDots?: boolean
  dotSize?: number
}

// Animated Polygon Component
const AnimatedPolygon = Animated.createAnimatedComponent(Polygon)

interface RadarPolygonProps {
  dimensions: {
    centerX: number
    centerY: number
    angle: number
    max: number
    radius: number
  }
  fill: string
  stroke: string
  strokeWidth: number
  fillOpacity: number
  data: SkillsChartDataItem[]
}

const RadarPolygon: FC<RadarPolygonProps> = ({
  dimensions,
  fill,
  stroke,
  strokeWidth,
  fillOpacity,
  data,
}) => {
  const animatedValue = useSharedValue(0)

  const animatedProps = useAnimatedProps(() => {
    'worklet'
    const pointsArray: string[] = []
    const axes = data.length

    for (let i = 0; i < axes; i++) {
      const item = data[i]
      const value = typeof item?.value === 'number' && !Number.isNaN(item.value) ? item.value : 0

      // Calculate expansion
      const currentVal = value * animatedValue.value
      // Clamp to max if needed, or allow overflow if desired. Usually clamp.
      const clampedVal = Math.min(currentVal, dimensions.max)

      const adjustedPoint = (clampedVal / dimensions.max) * dimensions.radius

      // -PI/2 to start at 12 o'clock
      const angle = dimensions.angle * i - Math.PI / 2

      const x = dimensions.centerX + adjustedPoint * Math.cos(angle)
      const y = dimensions.centerY + adjustedPoint * Math.sin(angle)

      const xNum = typeof x === 'number' && !Number.isNaN(x) ? x : 0
      const yNum = typeof y === 'number' && !Number.isNaN(y) ? y : 0

      pointsArray.push(`${xNum},${yNum}`)
    }

    return {
      points: pointsArray.join(' '),
    }
  })

  useEffect(() => {
    animatedValue.value = withSpring(1, { damping: 12, stiffness: 90 })
  }, [])

  return (
    <AnimatedPolygon
      animatedProps={animatedProps}
      fill={fill}
      fillOpacity={fillOpacity}
      stroke={stroke}
      strokeWidth={strokeWidth}
    />
  )
}

/**
 * Custom Skills Chart component using SVG and Reanimated
 *
 * A highly customizable radar chart built from scratch with SVG and animations.
 * Supports multiple datasets, gradients, and custom theming.
 */
export const SkillsChart: FC<SkillsChartProps> = ({
  datasets,
  showSets = [0, 1],
  height = 300,
  width,
  radius = 100,
  maxValue = 100,
  bg = 'transparent',
  gridColor = '$color6',
  labelColor = '$color11',
  labelTextSize = 12,
  showDots = true,
  dotSize = 4,
}) => {
  const { width: screenWidth } = useWindowDimensions()
  const theme = useTheme()
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  // Determine actual dimensions
  const chartWidth = width || Math.max(dimensions.width, 300)
  const chartHeight = height || Math.max(dimensions.height, 300)

  // Calculate effective radius (use provided radius or auto-calculate from available space with padding for labels)
  const effectiveRadius = radius || Math.min(chartWidth, chartHeight) / 2 - 40

  // Helper to safely resolve colors
  const resolveColor = (color: string | any): string => {
    if (typeof color === 'string' && color.startsWith('$')) {
      return (theme[color]?.get() as string) || color
    }
    return String(color)
  }

  // Resolve simplified colors
  const itemsColor = resolveColor(gridColor)
  const resolvedLabelColor = resolveColor(labelColor)

  // Validate datasets
  if (!datasets || datasets.length === 0 || !datasets[0]?.data?.length) {
    return (
      <View items="center" justify="center" minH={chartHeight} width={chartWidth}>
        <Text color="$red10">No data available</Text>
      </View>
    )
  }

  const axes = datasets[0].data.length
  const calculated = useMemo(
    () => ({
      centerX: chartWidth / 2,
      centerY: chartHeight / 2,
      angle: (2 * Math.PI) / axes,
      max: maxValue,
      radius: effectiveRadius,
    }),
    [chartWidth, chartHeight, axes, maxValue, effectiveRadius]
  )

  // Render the spider web grid
  const renderGrid = () => {
    const levels = 4 // How many concentric rings
    const rings = []

    // Concentric polygons/circles
    for (let level = 1; level <= levels; level++) {
      const levelFactor = level / levels
      const r = effectiveRadius * levelFactor

      // Create polygon points for the grid
      const points = datasets[0].data
        .map((_, i) => {
          const angle = calculated.angle * i - Math.PI / 2
          const x = calculated.centerX + r * Math.cos(angle)
          const y = calculated.centerY + r * Math.sin(angle)
          return `${x},${y}`
        })
        .join(' ')

      rings.push(
        <Polygon
          key={`grid-ring-${level}`}
          points={points}
          stroke={itemsColor}
          strokeWidth="1"
          strokeOpacity={0.3}
          fill="none"
        />
      )
    }

    // Spokes from center
    const spokes = datasets[0].data.map((item, i) => {
      const angle = calculated.angle * i - Math.PI / 2
      const x = calculated.centerX + effectiveRadius * Math.cos(angle)
      const y = calculated.centerY + effectiveRadius * Math.sin(angle)

      return (
        <G key={`spoke-${item.label}-${i}`}>
          <Polygon
            points={`${calculated.centerX},${calculated.centerY} ${x},${y}`}
            stroke={itemsColor}
            strokeWidth="1"
            strokeOpacity={0.3}
          />
        </G>
      )
    })

    return (
      <G>
        {rings}
        {spokes}
      </G>
    )
  }

  // Render SVG Text Labels
  const renderLabels = () => {
    return datasets[0].data.map(({ label }, index) => {
      const angle = calculated.angle * index - Math.PI / 2
      // Push label out slightly further than radius
      const labelRadius = effectiveRadius + 25
      const x = calculated.centerX + labelRadius * Math.cos(angle)
      const y = calculated.centerY + labelRadius * Math.sin(angle)

      // Determine text anchor based on horizontal position
      let textAnchor: TextAnchor = 'middle'
      if (x > calculated.centerX + 10) textAnchor = 'start'
      if (x < calculated.centerX - 10) textAnchor = 'end'

      // Determine baseline based on vertical position
      // SVG text alignment is tricky, simple vertical adjust often works best
      let dy = 0 // middle
      if (y < calculated.centerY - 10) dy = 0 // top half
      if (y > calculated.centerY + 10) dy = 10 // bottom half need to push down

      return (
        <SvgText
          key={`label-${label}`}
          x={x}
          y={y}
          dy={dy}
          fill={resolvedLabelColor}
          fontSize={labelTextSize}
          fontWeight="bold"
          textAnchor={textAnchor}
          alignmentBaseline="middle"
        >
          {label}
        </SvgText>
      )
    })
  }

  // Render dots at vertices
  const renderDots = (dataset: SkillsChartDataset, index: number) => {
    if (!showDots) return null

    // Resolve color
    const rawColor = dataset.strokeColor || dataset.fillColor || '$blue10'
    const color = resolveColor(rawColor)

    return dataset.data.map((item, i) => {
      const value = Math.min(item.value, maxValue)
      const dist = (value / maxValue) * effectiveRadius
      const angle = calculated.angle * i - Math.PI / 2
      const x = calculated.centerX + dist * Math.cos(angle)
      const y = calculated.centerY + dist * Math.sin(angle)

      return (
        <Circle
          key={`dot-${index}-${item.label}-${i}`}
          cx={x}
          cy={y}
          r={dotSize}
          fill={color}
          stroke={resolveColor(bg)}
          strokeWidth={1.5}
        />
      )
    })
  }

  return (
    <View
      items="center"
      justify="center"
      minH={height || 300}
      width={width || '100%'}
      bg={bg}
      overflow="hidden"
      onLayout={(event) => {
        const { width: layoutWidth, height: layoutHeight } = event.nativeEvent.layout
        setDimensions({ width: layoutWidth, height: layoutHeight })
      }}
    >
      <Svg height={chartHeight} width={chartWidth}>
        <Defs>
          {datasets.map((set, i) => {
            if (set.gradient) {
              const start = resolveColor(set.gradient.startColor)
              const end = resolveColor(set.gradient.endColor)
              return (
                <LinearGradient
                  key={`grad-${set.label}-${i}`}
                  id={`grad-${i}`}
                  x1="0"
                  y1="0"
                  x2="1"
                  y2="1"
                >
                  <Stop offset="0" stopColor={start} stopOpacity={set.fillOpacity ?? 0.5} />
                  <Stop offset="1" stopColor={end} stopOpacity={(set.fillOpacity ?? 0.5) * 0.5} />
                </LinearGradient>
              )
            }
            return null
          })}
        </Defs>

        {renderGrid()}
        {renderLabels()}

        {/* Render Datasets */}
        {datasets.map((d, i) => {
          if (!showSets.includes(i)) return null

          // Resolve colors
          let fill = d.fillColor || '$blue10'
          fill = resolveColor(fill)

          let stroke = d.strokeColor || fill
          stroke = resolveColor(stroke)

          const fillId = d.gradient ? `url(#grad-${i})` : fill

          return (
            <G key={`dataset-${d.label}-${i}`}>
              <RadarPolygon
                dimensions={calculated}
                data={d.data}
                fill={fillId}
                stroke={stroke}
                strokeWidth={d.strokeWidth || 2}
                fillOpacity={d.gradient ? 1 : d.fillOpacity || 0.3}
              />
              {renderDots(d, i)}
            </G>
          )
        })}
      </Svg>
    </View>
  )
}
