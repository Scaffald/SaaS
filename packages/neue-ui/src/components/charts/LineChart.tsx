import type { TextStyle } from 'react-native'
import { Platform } from 'react-native'
import { LineChart as GiftedLineChart } from 'react-native-gifted-charts'
import { View } from 'tamagui'

export interface LineChartData {
  value: number
  label?: string
  dataPointColor?: string
  dataPointRadius?: number
  dataPointText?: string
  hideDataPoint?: boolean
  textColor?: string
  textSize?: number
  textShiftY?: number
  textShiftX?: number
}

export interface LineChartProps {
  data: LineChartData[]
  height?: number
  width?: number
  showYAxisIndices?: boolean
  showXAxisIndices?: boolean
  yAxisColor?: string
  xAxisColor?: string
  yAxisTextStyle?: TextStyle
  xAxisLabelTextStyle?: TextStyle
  areaChart?: boolean
  startFillColor?: string
  endFillColor?: string
  startOpacity?: number
  endOpacity?: number
  gradientColor?: string
  curved?: boolean
  strokeWidth?: number
  color?: string
  hideDataPoints?: boolean
  dataPointsColor?: string
  dataPointsRadius?: number
  showStrip?: boolean
  stripColor?: string
  stripOpacity?: number
  stripWidth?: number
  stripHeight?: number
  isAnimated?: boolean
  animationDuration?: number
  onPress?: (item: LineChartData, index: number) => void
}

/**
 * Reusable Line Chart component using react-native-gifted-charts
 *
 * Provides a styled line chart with consistent theming and customization options.
 * Built on top of react-native-gifted-charts with additional styling and defaults.
 *
 * @param data - Array of chart data points
 * @param height - Chart height (defaults to 200)
 * @param width - Chart width (defaults to undefined for auto-sizing)
 * @param showYAxisIndices - Show Y-axis grid lines (defaults to true)
 * @param showXAxisIndices - Show X-axis grid lines (defaults to false)
 * @param yAxisColor - Y-axis line color
 * @param xAxisColor - X-axis line color
 * @param yAxisTextStyle - Y-axis text styling
 * @param xAxisLabelTextStyle - X-axis label text styling
 * @param areaChart - Enable area chart mode
 * @param startFillColor - Start color for area fill
 * @param endFillColor - End color for area fill
 * @param startOpacity - Start opacity for area fill
 * @param endOpacity - End opacity for area fill
 * @param gradientColor - Gradient color for area
 * @param curved - Enable curved line
 * @param strokeWidth - Line stroke width
 * @param color - Line color
 * @param hideDataPoints - Hide data point markers
 * @param dataPointsColor - Data point color
 * @param dataPointsRadius - Data point radius
 * @param showStrip - Show vertical strip on data points
 * @param stripColor - Strip color
 * @param stripOpacity - Strip opacity
 * @param stripWidth - Strip width
 * @param stripHeight - Strip height
 * @param isAnimated - Enable animations
 * @param animationDuration - Animation duration in milliseconds
 * @param onPress - Callback when data point is pressed
 * @returns JSX element
 *
 * @example
 * ```tsx
 * const data = [
 *   { value: 50, label: 'Jan' },
 *   { value: 80, label: 'Feb' },
 *   { value: 90, label: 'Mar' },
 *   { value: 70, label: 'Apr' }
 * ]
 *
 * <LineChart data={data} height={250} curved />
 * <LineChart data={data} height={250} areaChart />
 * ```
 */
export const LineChart = ({
  data,
  height = 200,
  width,
  showYAxisIndices = true,
  showXAxisIndices = false,
  yAxisColor = '#333',
  xAxisColor = '#333',
  yAxisTextStyle,
  xAxisLabelTextStyle,
  areaChart = false,
  startFillColor = '#1B6B93',
  endFillColor = '#4FC3F7',
  startOpacity = 0.4,
  endOpacity = 0.1,
  gradientColor = '#1B6B93',
  curved = true,
  strokeWidth = 3,
  color = '#1B6B93',
  hideDataPoints = false,
  dataPointsColor = '#1B6B93',
  dataPointsRadius = 4,
  showStrip = false,
  stripColor = '#1B6B93',
  stripOpacity = 0.1,
  stripWidth = 1,
  stripHeight = 80,
  isAnimated = true,
  animationDuration = 800,
  onPress,
  ...props
}: LineChartProps) => {
  // Filter out web-incompatible props
  const webCompatibleProps =
    Platform.OS === 'web'
      ? Object.fromEntries(
          Object.entries(props).filter(
            ([key]) =>
              !key.includes('onPressOut') &&
              !key.includes('onLongPress') &&
              !key.includes('onContextMenu') &&
              !key.includes('onMouseEnter') &&
              !key.includes('onMouseLeave')
          )
        )
      : props

  return (
    <View>
      <GiftedLineChart
        data={data}
        height={height}
        width={width}
        showYAxisIndices={showYAxisIndices}
        showXAxisIndices={showXAxisIndices}
        yAxisColor={yAxisColor}
        xAxisColor={xAxisColor}
        yAxisTextStyle={yAxisTextStyle}
        xAxisLabelTextStyle={xAxisLabelTextStyle}
        areaChart={areaChart}
        startFillColor={startFillColor}
        endFillColor={endFillColor}
        startOpacity={startOpacity}
        endOpacity={endOpacity}
        curved={curved}
        color={color}
        hideDataPoints={hideDataPoints}
        dataPointsColor={dataPointsColor}
        dataPointsRadius={dataPointsRadius}
        stripColor={stripColor}
        stripOpacity={stripOpacity}
        stripWidth={stripWidth}
        stripHeight={stripHeight}
        isAnimated={isAnimated}
        animationDuration={animationDuration}
        onPress={onPress}
        {...webCompatibleProps}
      />
    </View>
  )
}
