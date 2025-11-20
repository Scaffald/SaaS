import type { TextStyle } from 'react-native'
import { PopulationPyramid as GiftedPopulationPyramid } from 'react-native-gifted-charts'
import { View } from 'tamagui'

export interface PopulationPyramidData {
  left: number
  right: number
  label?: string
}

export interface PopulationPyramidProps {
  data: PopulationPyramidData[]
  height?: number
  width?: number
  showYAxisIndices?: boolean
  showXAxisIndices?: boolean
  yAxisColor?: string
  xAxisColor?: string
  yAxisTextStyle?: TextStyle
  xAxisLabelTextStyle?: TextStyle
  leftBarColor?: string
  rightBarColor?: string
  leftBarBorderColor?: string
  rightBarBorderColor?: string
  leftBarBorderWidth?: number
  rightBarBorderWidth?: number
  leftBarBorderRadius?: number
  rightBarBorderRadius?: number
  leftBarLabelColor?: string
  rightBarLabelColor?: string
  leftBarLabelTextStyle?: TextStyle
  rightBarLabelTextStyle?: TextStyle
  showValuesAsLabels?: boolean
  isAnimated?: boolean
  animationDuration?: number
  onPress?: (item: PopulationPyramidData, index: number) => void
}

/**
 * Reusable Population Pyramid component using react-native-gifted-charts
 *
 * Provides a styled population pyramid chart with consistent theming and customization options.
 * Built on top of react-native-gifted-charts with additional styling and defaults.
 *
 * @param data - Array of population pyramid data points
 * @param height - Chart height (defaults to 200)
 * @param width - Chart width (defaults to undefined for auto-sizing)
 * @param showYAxisIndices - Show Y-axis grid lines (defaults to true)
 * @param showXAxisIndices - Show X-axis grid lines (defaults to false)
 * @param yAxisColor - Y-axis line color
 * @param xAxisColor - X-axis line color
 * @param yAxisTextStyle - Y-axis text styling
 * @param xAxisLabelTextStyle - X-axis label text styling
 * @param leftBarColor - Left bar color
 * @param rightBarColor - Right bar color
 * @param leftBarBorderColor - Left bar border color
 * @param rightBarBorderColor - Right bar border color
 * @param leftBarBorderWidth - Left bar border width
 * @param rightBarBorderWidth - Right bar border width
 * @param leftBarBorderRadius - Left bar border radius
 * @param rightBarBorderRadius - Right bar border radius
 * @param leftBarLabelColor - Left bar label color
 * @param rightBarLabelColor - Right bar label color
 * @param leftBarLabelTextStyle - Left bar label text styling
 * @param rightBarLabelTextStyle - Right bar label text styling
 * @param showValuesAsLabels - Show values as labels
 * @param isAnimated - Enable animations
 * @param animationDuration - Animation duration in milliseconds
 * @param onPress - Callback when bar is pressed
 * @returns JSX element
 *
 * @example
 * ```tsx
 * const data = [
 *   { left: 10, right: 12, label: '0-4' },
 *   { left: 8, right: 9, label: '5-9' },
 *   { left: 6, right: 7, label: '10-14' }
 * ]
 *
 * <PopulationPyramid data={data} height={250} />
 * ```
 */
export const PopulationPyramid = ({
  data,
  height = 200,
  width,
  showYAxisIndices = true,
  showXAxisIndices = false,
  yAxisColor = '#333',
  xAxisColor = '#333',
  yAxisTextStyle,
  xAxisLabelTextStyle,
  leftBarColor = '#1B6B93',
  rightBarColor = '#4FC3F7',
  leftBarBorderColor = '#1B6B93',
  rightBarBorderColor = '#4FC3F7',
  leftBarBorderWidth = 1,
  rightBarBorderWidth = 1,
  leftBarBorderRadius = 4,
  rightBarBorderRadius = 4,
  leftBarLabelColor = '#333',
  rightBarLabelColor = '#333',
  leftBarLabelTextStyle,
  rightBarLabelTextStyle,
  showValuesAsLabels = false,
  isAnimated = true,
  animationDuration = 800,
  onPress,
  ...props
}: PopulationPyramidProps) => {
  return (
    <View>
      <GiftedPopulationPyramid
        data={data}
        height={height}
        width={width}
        showYAxisIndices={showYAxisIndices}
        showXAxisIndices={showXAxisIndices}
        yAxisColor={yAxisColor}
        xAxisColor={xAxisColor}
        leftBarColor={leftBarColor}
        rightBarColor={rightBarColor}
        leftBarBorderColor={leftBarBorderColor}
        rightBarBorderColor={rightBarBorderColor}
        leftBarBorderWidth={leftBarBorderWidth}
        rightBarBorderWidth={rightBarBorderWidth}
        leftBarLabelColor={leftBarLabelColor}
        rightBarLabelColor={rightBarLabelColor}
        {...props}
      />
    </View>
  )
}
