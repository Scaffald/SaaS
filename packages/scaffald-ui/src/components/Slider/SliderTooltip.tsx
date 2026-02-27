/**
 * SliderTooltip component
 * Displays the current value(s) above or below the handle
 */

import { View, Text, StyleSheet } from 'react-native'
import type { ViewStyle, TextStyle } from 'react-native'
import { colors } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { borderRadius } from '../../tokens/borders'
import { typography } from '../../tokens/typography'
import type { SliderColor, SliderIndicatorPosition } from './Slider.types'

export interface SliderTooltipProps {
  /**
   * Value to display (for single value slider)
   */
  value?: number

  /**
   * Range values to display (for range slider)
   */
  range?: [number, number]

  /**
   * Color variant
   */
  color?: SliderColor

  /**
   * Position relative to handle
   */
  position?: SliderIndicatorPosition

  /**
   * Custom style for the tooltip container
   */
  style?: ViewStyle

  /**
   * Custom style for the tooltip text
   */
  textStyle?: TextStyle
}

export function SliderTooltip({
  value,
  range,
  color = 'primary',
  position = 'top',
  style,
  textStyle,
}: SliderTooltipProps) {
  if (position === 'none') return null

  const getBackgroundColor = (): string => {
    if (color === 'primary') {
      return colors.primary[500]
    }
    // Gray variant - use theme-aware gray
    // For tooltip, use dark gray in both themes for contrast
    return colors.gray[900]
  }

  const getDisplayText = (): string => {
    if (range) {
      return `${range[0]}-${range[1]}`
    }
    if (value !== undefined) {
      return `${value}`
    }
    return '0'
  }

  const tooltipPosition: ViewStyle =
    position === 'bottom'
      ? {
          top: 20, // 20px below handle (from Figma)
        }
      : {
          bottom: 26, // 26px above handle (from Figma: -26px becomes bottom: 26px)
        }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: getBackgroundColor(),
        },
        tooltipPosition,
        style,
      ]}
      pointerEvents="none"
    >
      <Text style={[styles.text, textStyle]}>{getDisplayText()}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: '50%',
    marginLeft: -12, // Half of minWidth to center (approximate)
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.xxxl, // 32px
    minWidth: 24, // Minimum width to ensure pill shape
  },
  text: {
    fontFamily: typography.caption.fontFamily,
    fontSize: typography.caption.fontSize,
    fontWeight: typography.caption.fontWeight,
    lineHeight: typography.caption.lineHeight,
    color: colors.white,
    textAlign: 'center',
  },
})

