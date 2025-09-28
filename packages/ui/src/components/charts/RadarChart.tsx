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
  // Use datasets if provided, otherwise fall back to single data array
  const chartData = datasets ? datasets[0]?.data : data
  if (!chartData) return null

  // Convert data format from objects to numbers array for the library
  const chartDataValues = chartData.map((item) => item.value)
  const labels = chartData.map((item) => item.label || '')

  return (
    <View alignItems="center" backgroundColor={backgroundColor} borderRadius="$4" padding="$4">
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
        backgroundColor={backgroundColor}
        gridColor={gridColor}
        labelColor={labelColor}
        labelTextSize={labelTextSize}
        {...props}
      />
    </View>
  )
}
