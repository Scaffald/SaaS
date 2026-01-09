/**
 * Chart component styles
 * All styles mapped from Figma Forsured Design System
 */

import type { ViewStyle, TextStyle } from 'react-native'
import { colors } from '../../tokens/colors'
import type { ThemeMode } from '../../tokens/colors'
import { typography } from '../../tokens/typography'
import type { ChartStyleConfig } from './Chart.types'

/**
 * Get chart styles based on theme
 */
export function getChartStyles(theme: ThemeMode = 'light'): ChartStyleConfig {

  // Base container styles
  const container: ViewStyle = {
    width: '100%',
    flexDirection: 'column',
    backgroundColor: colors.bg[theme].default,
    borderRadius: 0,
  }

  // Grid styles
  const grid: ViewStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderColor: colors.border[theme].default,
    opacity: 0.3,
  }

  // Axis styles (Note: strokeColor is not a valid ViewStyle property)
  // This is kept for SVG components that use it directly
  const axis: ViewStyle = {
    borderColor: colors.border[theme].default,
    borderWidth: 1,
  }

  // Axis label styles
  const axisLabel: TextStyle = {
    ...typography.caption,
    color: colors.text[theme].tertiary,
    letterSpacing: 0,
  }

  // Chart area styles
  const chartArea: ViewStyle = {
    flex: 1,
    position: 'relative',
  }

  return {
    container,
    grid,
    axis,
    axisLabel,
    chartArea,
  }
}
