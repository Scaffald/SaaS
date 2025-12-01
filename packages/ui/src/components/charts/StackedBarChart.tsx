import type { TextStyle } from 'react-native'
import { BarChart as GiftedBarChart } from 'react-native-gifted-charts'
import { View } from 'tamagui'

export interface StackedBarChartData {
  stacks: Array<{
    value: number
    color: string
    label?: string
  }>
  label?: string
}

export interface StackedBarChartProps {
  data: StackedBarChartData[]
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
  onPress?: (item: StackedBarChartData, index: number) => void
}

/**
 * Reusable Stacked Bar Chart component using react-native-gifted-charts
 *
 * Provides a styled stacked bar chart with consistent theming and customization options.
 * Built on top of react-native-gifted-charts with additional styling and defaults.
 *
 * @param data - Array of stacked bar chart data points
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
 *   {
 *     stacks: [
 *       { value: 20, color: '#1B6B93', label: 'Q1' },
 *       { value: 30, color: '#4FC3F7', label: 'Q2' },
 *       { value: 25, color: '#A8E6CF', label: 'Q3' }
 *     ],
 *     label: 'Product A'
 *   }
 * ]
 *
 * <StackedBarChart data={data} height={250} />
 * ```
 */
export const StackedBarChart = ({
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
  onPress,
  ...props
}: StackedBarChartProps) => {
  return (
    <View>
      <GiftedBarChart
        stackData={data}
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
        onPress={onPress}
        {...props}
      />
    </View>
  )
}
