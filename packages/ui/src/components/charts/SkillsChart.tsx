import { useEffect, FC } from 'react'
import { useWindowDimensions } from 'react-native'
import { View, Text, type GetThemeValueForKey } from 'tamagui'
import { Svg, G, Defs, LinearGradient, Stop, Rect, Circle, Polygon } from 'react-native-svg'
import Animated, { useSharedValue, useAnimatedProps, withSpring } from 'react-native-reanimated'
import { randomUUID } from 'expo-crypto'

// Data interfaces
export interface SkillsChartDataItem {
  label: string
  value: number
}

export interface SkillsChartDataset {
  label: string
  data: SkillsChartDataItem[]
  fillColor?: GetThemeValueForKey<'backgroundColor'>
  strokeColor?: string
  strokeWidth?: number
  fillOpacity?: number
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
  labelColor?: GetThemeValueForKey<'color'>
  labelTextSize?: number
  isAnimated?: boolean
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
  data: SkillsChartDataItem[]
}

const RadarPolygon: FC<RadarPolygonProps> = ({ dimensions, fill, stroke, data }) => {
  const animatedValue = useSharedValue(0)

  const animatedProps = useAnimatedProps(() => {
    const animatedPoints = data.map(({ value }, i) => {
      const adjustedPoint = (value / dimensions.max) * animatedValue.value * dimensions.radius
      const x = dimensions.centerX + adjustedPoint * Math.cos(dimensions.angle * i - Math.PI / 2)
      const y = dimensions.centerY + adjustedPoint * Math.sin(dimensions.angle * i - Math.PI / 2)
      return `${x},${y}`
    })

    return {
      points: animatedPoints.join(' '),
    }
  })

  useEffect(() => {
    animatedValue.value = withSpring(1)
  }, [])

  return (
    <AnimatedPolygon animatedProps={animatedProps} fill={fill} stroke={stroke} strokeWidth="2" />
  )
}

/**
 * Custom Skills Chart component using SVG and Reanimated
 *
 * A highly customizable radar chart built from scratch with SVG and animations.
 * Perfect for displaying skill sets, performance metrics, or multi-dimensional data.
 *
 * @param datasets - Array of skill datasets to display
 * @param showSets - Array of dataset indices to show (defaults to [0, 1])
 * @param height - Chart height (defaults to 300)
 * @param width - Chart width (defaults to screen width)
 * @param radius - Chart radius (defaults to 120)
 * @param maxValue - Maximum value for scaling (defaults to 100)
 * @param bg - Background color (defaults to transparent)
 * @param gridColor - Grid line color (defaults to #E0E0E0)
 * @param labelColor - Label text color (defaults to #E0E0E0)
 * @param labelTextSize - Label font size (defaults to 12)
 * @param isAnimated - Enable animations (defaults to true)
 * @returns JSX element
 *
 * @example
 * ```tsx
 * const skillsData = [
 *   {
 *     label: "Hard Skills",
 *     data: [
 *       { label: "React", value: 90 },
 *       { label: "TypeScript", value: 85 },
 *       { label: "Node.js", value: 80 }
 *     ],
 *     fillColor: '#4FC3F7',
 *     strokeColor: '#29B6F6'
 *   }
 * ]
 *
 * <SkillsChart datasets={skillsData} height={300} />
 * ```
 */
export const SkillsChart: FC<SkillsChartProps> = ({
  datasets,
  showSets = [0, 1],
  height = 300,
  width,
  radius = 120,
  maxValue = 100,
  bg = 'transparent',
  gridColor = '#E0E0E0',
  labelTextSize = 12,
}) => {
  const { width: screenWidth } = useWindowDimensions()
  const chartWidth = width || screenWidth
  const chartHeight = height

  if (showSets.some((index) => index >= datasets.length)) {
    return (
      <View items="center" justify="center" minH={chartHeight}>
        <Text color="$red10">Cannot Display Data</Text>
      </View>
    )
  }

  const axes = datasets[0].data.length
  const calculated = {
    centerX: chartWidth / 2,
    centerY: chartHeight / 2,
    angle: (2 * Math.PI) / axes,
    angleDeg: 360 / axes,
    max: maxValue,
    radius,
  }

  const renderAxis = (data: SkillsChartDataItem[]) =>
    data.map((_, i) => (
      <G key={`axis-circle-${i}-${radius}`}>
        <Circle
          cx={calculated.centerX}
          cy={calculated.centerY}
          r={(radius / axes) * (i + 1)}
          stroke={gridColor}
          strokeWidth="0.5"
          fill="none"
        />
        <Rect
          width={1}
          height={radius}
          fill="url(#gradient)"
          transform={`translate(${calculated.centerX}, ${calculated.centerY}) rotate(${180 + calculated.angleDeg * i}, ${0.5}, ${0.5})`}
        />
      </G>
    ))

  const renderLabels = (data: SkillsChartDataItem[], set: number, index: number) => (
    <View key={set} position="absolute" height="100%" flex={1}>
      {data.map(({ label }, i) => {
        const x = calculated.centerX + radius * Math.cos(calculated.angle * i - Math.PI / 2)
        const y = calculated.centerY + radius * Math.sin(calculated.angle * i - Math.PI / 2)
        let left = x - 40
        let top = y + index * 20

        if (y < calculated.centerY && x !== calculated.centerX) top -= 10
        if (y < calculated.centerY && x === calculated.centerX) top -= 30
        if (y > calculated.centerY) top += 20
        if (x < calculated.centerX) left -= 20
        if (x > calculated.centerX) left += 20

        return (
          <View
            key={randomUUID()}
            position="absolute"
            l={left}
            t={top}
            items="center"
            justify="center"
          >
            <Text
              fontSize={labelTextSize}
              fontWeight="bold"
              color="$color12"
              text="center"
              numberOfLines={2}
            >
              {label}
            </Text>
          </View>
        )
      })}
    </View>
  )

  return (
    <View items="center" justify="center" minH={chartHeight} flex={1} bg={bg}>
      <View position="absolute" height="100%" flex={1}>
        <Svg height="100%" width="100%">
          <Defs>
            <LinearGradient id="gradient" gradientTransform="rotate(90)">
              <Stop offset="0%" stopColor={gridColor} />
              <Stop offset="100%" stopColor={gridColor} stopOpacity={0.3} />
            </LinearGradient>
          </Defs>

          {renderAxis(datasets[0].data)}

          {showSets.map((s) => (
            <RadarPolygon
              key={s}
              dimensions={calculated}
              fill={(datasets[s].fillColor as string) || '#1B6B93'}
              stroke={datasets[s].strokeColor || '#4FC3F7'}
              data={datasets[s].data}
            />
          ))}
        </Svg>
      </View>

      {showSets.map((s, i) => renderLabels(datasets[s].data, s, i))}
    </View>
  )
}
