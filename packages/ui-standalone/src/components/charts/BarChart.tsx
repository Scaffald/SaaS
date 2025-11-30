import type { TextStyle } from 'react-native'
import { BarChart as GiftedBarChart } from 'react-native-gifted-charts'
import { View } from 'tamagui'

export interface BarChartData {
  value: number
  label?: string
  frontColor?: string
  gradientColor?: string
  spacing?: number
}

export interface BarChartProps {
  data: BarChartData[]
  height?: number
  width?: number
  showYAxisIndices?: boolean
  showXAxisIndices?: boolean
  yAxisColor?: string
  xAxisColor?: string
  yAxisTextStyle?: TextStyle
  xAxisLabelTextStyle?: TextStyle
  barWidth?: number
  noOfSections?: number
  maxValue?: number
  spacing?: number
  roundedTop?: boolean
  roundedBottom?: boolean
  isThreeD?: boolean
  isAnimated?: boolean
  animationDuration?: number
  showGradient?: boolean
  onPress?: (item: BarChartData, index: number) => void
}

/**
 * Reusable Bar Chart component using react-native-gifted-charts
 *
 * Provides a styled bar chart with consistent theming and customization options.
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
 * @param barWidth - Width of individual bars
 * @param noOfSections - Number of Y-axis sections
 * @param maxValue - Maximum value for Y-axis scaling
 * @param spacing - Spacing between bars
 * @param roundedTop - Rounded top corners for bars
 * @param roundedBottom - Rounded bottom corners for bars
 * @param isThreeD - Enable 3D effect
 * @param isAnimated - Enable animations
 * @param animationDuration - Animation duration in milliseconds
 * @param onPress - Callback when bar is pressed
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
 * <BarChart data={data} height={250} />
 * ```
 */
export const BarChart = ({
  data,
  height = 200,
  width,
  showYAxisIndices = true,
  showXAxisIndices = false,
  yAxisColor = '#333',
  xAxisColor = '#333',
  yAxisTextStyle,
  xAxisLabelTextStyle,
  barWidth,
  noOfSections = 4,
  maxValue,
  spacing = 2,
  roundedTop = true,
  roundedBottom = true,
  isThreeD = false,
  isAnimated = true,
  animationDuration = 800,
  showGradient = false,
  onPress,
  ...props
}: BarChartProps) => {
  return (
    <View>
      <GiftedBarChart
        data={data}
        height={height}
        width={width}
        showYAxisIndices={showYAxisIndices}
        showXAxisIndices={showXAxisIndices}
        yAxisColor={yAxisColor}
        xAxisColor={xAxisColor}
        yAxisTextStyle={yAxisTextStyle}
        xAxisLabelTextStyle={xAxisLabelTextStyle}
        barWidth={barWidth}
        noOfSections={noOfSections}
        maxValue={maxValue}
        spacing={spacing}
        roundedTop={roundedTop}
        roundedBottom={roundedBottom}
        isThreeD={isThreeD}
        isAnimated={isAnimated}
        animationDuration={animationDuration}
        showGradient={showGradient}
        onPress={onPress}
        {...props}
      />
    </View>
  )
}
