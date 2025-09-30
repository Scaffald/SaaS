import { RadarChart as GiftedRadarChart } from 'react-native-gifted-charts'
import { View } from 'tamagui'

export interface RadarChartData {
  value: number
  label?: string
  color?: string
}

export interface RadarChartDataset {
  data: RadarChartData[]
  color?: string
  fillColor?: string
  strokeColor?: string
  strokeWidth?: number
  fillOpacity?: number
  label?: string
}

export interface RadarChartProps {
  data?: RadarChartData[]
  datasets?: RadarChartDataset[]
  height?: number
  width?: number
  radius?: number
  maxValue?: number
  noOfSections?: number
  showValuesAsLabels?: boolean
  showStrip?: boolean
  stripColor?: string
  stripOpacity?: number
  stripWidth?: number
  stripHeight?: number
  color?: string
  strokeWidth?: number
  backgroundColor?: string
  gridColor?: string
  labelColor?: string
  labelTextSize?: number
  isAnimated?: boolean
  animationDuration?: number
  onPress?: (item: RadarChartData, index: number) => void
}

/**
 * Reusable Radar Chart component using react-native-gifted-charts
 *
 * Provides a styled radar chart with consistent theming and customization options.
 * Built on top of react-native-gifted-charts with additional styling and defaults.
 *
 * @param data - Array of radar chart data points
 * @param height - Chart height (defaults to 200)
 * @param width - Chart width (defaults to undefined for auto-sizing)
 * @param radius - Chart radius (defaults to 80)
 * @param maxValue - Maximum value for scaling
 * @param noOfSections - Number of sections/rings
 * @param showValuesAsLabels - Show values as labels
 * @param showStrip - Show vertical strips
 * @param stripColor - Strip color
 * @param stripOpacity - Strip opacity
 * @param stripWidth - Strip width
 * @param stripHeight - Strip height
 * @param color - Chart line color
 * @param strokeWidth - Line stroke width
 * @param isAnimated - Enable animations
 * @param animationDuration - Animation duration in milliseconds
 * @param onPress - Callback when data point is pressed
 * @returns JSX element
 *
 * @example
 * ```tsx
 * const data = [
 *   { value: 80, label: 'Speed' },
 *   { value: 60, label: 'Power' },
 *   { value: 90, label: 'Control' },
 *   { value: 70, label: 'Endurance' }
 * ]
 *
 * <RadarChart data={data} height={250} />
 * ```
 */
export const RadarChart = ({
  data,
  datasets,
  height = 200,
  width,
  radius = 80,
  maxValue,
  noOfSections = 4,
  showValuesAsLabels = false,
  showStrip = false,
  stripColor = '#1B6B93',
  stripOpacity = 0.1,
  stripWidth = 1,
  stripHeight = 80,
  color = '#1B6B93',
  strokeWidth = 3,
  backgroundColor = 'transparent',
  gridColor = '#E0E0E0',
  labelColor = '#E0E0E0',
  labelTextSize = 12,
  isAnimated = true,
  animationDuration = 800,
  onPress,
  ...props
}: RadarChartProps) => {
  // Debug logging
  console.log('RadarChart props:', { data, datasets, height, radius, maxValue })

  // Handle multiple datasets or single data array
  if (datasets && datasets.length > 0) {
    console.log('Using datasets:', datasets)
    // For multiple datasets, use dataPoints prop
    const dataPoints = datasets.map((dataset) => ({
      data: dataset.data.map((item) => item.value),
      color: dataset.color || dataset.strokeColor || '#1B6B93',
      fillColor: dataset.fillColor,
      strokeColor: dataset.strokeColor,
      strokeWidth: dataset.strokeWidth || 2,
      fillOpacity: dataset.fillOpacity || 0.6,
    }))

    const labels = datasets[0].data.map((item) => item.label || '')
    console.log('DataPoints:', dataPoints)
    console.log('Labels:', labels)

    return (
      <View items="center" bg={backgroundColor} rounded="$4" p="$4">
        <GiftedRadarChart
          dataPoints={dataPoints}
          labels={labels}
          height={height}
          width={width}
          chartSize={radius * 2}
          maxValue={maxValue}
          noOfSections={noOfSections}
          isAnimated={isAnimated}
          animationDuration={animationDuration}
          bg={backgroundColor}
          gridColor={gridColor}
          labelColor={labelColor}
          labelTextSize={labelTextSize}
          {...props}
        />
      </View>
    )
  }

  // Single dataset fallback
  if (!data) {
    console.log('No data provided to RadarChart')
    return null
  }

  const chartDataValues = data.map((item) => item.value)
  const labels = data.map((item) => item.label || '')
  console.log('Single dataset - Values:', chartDataValues)
  console.log('Single dataset - Labels:', labels)

  return (
    <View items="center" bg={backgroundColor} rounded="$4" p="$4">
      <GiftedRadarChart
        data={chartDataValues}
        labels={labels}
        height={height}
        width={width}
        chartSize={radius * 2}
        maxValue={maxValue}
        noOfSections={noOfSections}
        isAnimated={isAnimated}
        animationDuration={animationDuration}
        bg={backgroundColor}
        gridColor={gridColor}
        labelColor={labelColor}
        labelTextSize={labelTextSize}
        {...props}
      />
    </View>
  )
}
