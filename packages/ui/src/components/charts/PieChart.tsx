import type { ReactNode } from 'react'
import { PieChart as GiftedPieChart } from 'react-native-gifted-charts'
import { View } from 'tamagui'

export interface PieChartData {
  value: number
  color?: string
  text?: string
  textColor?: string
  textSize?: number
  shiftTextX?: number
  shiftTextY?: number
  gradientCenterColor?: string
  focused?: boolean
  focusedOpacity?: number
}

export interface PieChartProps {
  data: PieChartData[]
  radius?: number
  innerRadius?: number
  donut?: boolean
  showText?: boolean
  showTextBackground?: boolean
  textBackgroundRadius?: number
  textColor?: string
  textSize?: number
  showValuesAsLabels?: boolean
  showGradient?: boolean
  gradientCenterColor?: string
  onPress?: (item: PieChartData, index: number) => void
  centerLabelComponent?: () => ReactNode
  focusOnPress?: boolean
  toggleFocusOnPress?: boolean
}

/**
 * Reusable Pie Chart component using react-native-gifted-charts
 *
 * Provides a styled pie chart with consistent theming and customization options.
 * Built on top of react-native-gifted-charts with additional styling and defaults.
 *
 * @param data - Array of chart data points
 * @param radius - Chart radius (defaults to 80)
 * @param innerRadius - Inner radius for donut chart
 * @param donut - Enable donut chart mode
 * @param showText - Show text labels on chart
 * @param showTextBackground - Show background for text labels (defaults to false for transparency)
 * @param textBackgroundRadius - Text background radius
 * @param textColor - Text color
 * @param textSize - Text size
 * @param showValuesAsLabels - Show values as labels
 * @param showGradient - Show gradient effects
 * @param gradientCenterColor - Gradient center color
 * @param onPress - Callback when segment is pressed
 * @param centerLabelComponent - Custom center label component
 * @param focusOnPress - Focus segment on press
 * @param toggleFocusOnPress - Toggle focus on press
 * @returns JSX element
 *
 * @example
 * ```tsx
 * const data = [
 *   { value: 40, color: '#1B6B93', text: 'Mobile' },
 *   { value: 35, color: '#4FC3F7', text: 'Web' },
 *   { value: 25, color: '#A8E6CF', text: 'Desktop' }
 * ]
 *
 * <PieChart data={data} radius={100} />
 * <PieChart data={data} radius={100} donut />
 * ```
 */
export const PieChart = ({
  data,
  radius = 80,
  innerRadius,
  donut = false,
  showText = true,
  showTextBackground = false,
  textBackgroundRadius = 40,
  textColor = '#333',
  textSize = 12,
  showValuesAsLabels = false,
  showGradient = false,
  gradientCenterColor = '#fff',
  onPress,
  centerLabelComponent,
  focusOnPress = false,
  toggleFocusOnPress = false,
  ...props
}: PieChartProps) => {
  // Convert theme values to strings
  const processedData = data.map((item) => ({
    ...item,
    color: '#1B6B93',
  }))

  return (
    <View items="center">
      <GiftedPieChart
        data={processedData}
        radius={radius}
        innerRadius={innerRadius}
        donut={donut}
        showText={showText}
        showTextBackground={showTextBackground}
        textBackgroundRadius={textBackgroundRadius}
        textColor={textColor}
        textSize={textSize}
        showValuesAsLabels={showValuesAsLabels}
        showGradient={showGradient}
        gradientCenterColor={gradientCenterColor}
        onPress={onPress}
        centerLabelComponent={centerLabelComponent}
        focusOnPress={focusOnPress}
        toggleFocusOnPress={toggleFocusOnPress}
        {...props}
      />
    </View>
  )
}
