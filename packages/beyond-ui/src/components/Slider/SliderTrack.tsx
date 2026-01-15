/**
 * SliderTrack component
 * Renders the track background and fill segment(s)
 */

import { View, StyleSheet } from 'react-native'
import type { ViewStyle, LayoutChangeEvent, DimensionValue } from 'react-native'
import { colors } from '../../tokens/colors'
import { borderRadius } from '../../tokens/borders'
import { useThemeContext } from '../../theme'
import type { SliderColor } from './Slider.types'

export interface SliderTrackProps {
  /**
   * Single value (0-100 or between min/max)
   */
  value?: number

  /**
   * Range values [min, max]
   */
  range?: [number, number]

  /**
   * Minimum value
   * @default 0
   */
  min?: number

  /**
   * Maximum value
   * @default 100
   */
  max?: number

  /**
   * Color variant
   * @default 'primary'
   */
  color?: SliderColor

  /**
   * Disabled state
   * @default false
   */
  disabled?: boolean

  /**
   * Callback when track layout is measured
   */
  onLayout?: (event: LayoutChangeEvent) => void

  /**
   * Custom style for the track container
   */
  style?: ViewStyle

  /**
   * Custom style for the fill
   */
  fillStyle?: ViewStyle
}

const TRACK_HEIGHT = 4 // 4px height from Figma

export function SliderTrack({
  value,
  range,
  min = 0,
  max = 100,
  color = 'primary',
  disabled = false,
  onLayout,
  style,
  fillStyle,
}: SliderTrackProps) {
  const { theme } = useThemeContext()
  const isLight = theme === 'light'

  const getBackgroundColor = (): string => {
    if (isLight) {
      return colors.bg.light.subtle // gray[100]
    }
    return colors.bg.dark.subtle // gray[700] or similar
  }

  const getFillColor = (): string => {
    if (color === 'primary') {
      return colors.primary[500]
    }
    // Gray variant
    return isLight ? colors.gray[900] : colors.gray[100]
  }

  // Calculate fill width(s) and position(s)
  const calculateFill = (): { left: string; width: string } => {
    if (range) {
      // Range slider: fill between min and max of range
      const rangeMin = Math.max(min, Math.min(max, range[0]))
      const rangeMax = Math.max(min, Math.min(max, range[1]))
      
      const leftPercent = ((rangeMin - min) / (max - min)) * 100
      const widthPercent = ((rangeMax - rangeMin) / (max - min)) * 100

      return {
        left: `${leftPercent}%`,
        width: `${widthPercent}%`,
      }
    }

    if (value !== undefined) {
      // Single value: fill from start to value
      const clampedValue = Math.max(min, Math.min(max, value))
      const widthPercent = ((clampedValue - min) / (max - min)) * 100

      return {
        left: '0%',
        width: `${widthPercent}%`,
      }
    }

    // Default: no fill
    return {
      left: '0%',
      width: '0%',
    }
  }

  const fill = calculateFill()

  return (
    <View
      style={[
        styles.track,
        {
          backgroundColor: getBackgroundColor(),
          height: TRACK_HEIGHT,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
      onLayout={onLayout}
    >
      <View
        style={[
          styles.fill,
          {
            backgroundColor: getFillColor(),
            left: fill.left as DimensionValue,
            width: fill.width as DimensionValue,
          },
          fillStyle,
        ]}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    borderRadius: borderRadius.max, // Fully rounded
    overflow: 'hidden',
    position: 'relative',
  },
  fill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderRadius: borderRadius.max, // Fully rounded
  },
})

