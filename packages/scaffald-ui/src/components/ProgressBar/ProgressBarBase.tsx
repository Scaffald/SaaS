/**
 * ProgressBarBase component
 * The actual progress bar element with fill based on percentage
 */

import { View, StyleSheet } from 'react-native'
import type { DimensionValue } from 'react-native'
import { colors } from '../../tokens/colors'
import { borderRadius } from '../../tokens/borders'
import type { ProgressBarBaseProps } from './ProgressBar.types'
import { useThemeContext } from '../../theme'

export function ProgressBarBase({
  value,
  color = 'primary',
  style,
  fillStyle,
}: ProgressBarBaseProps) {
  const { theme } = useThemeContext()
  const isLight = theme === 'light'

  // Clamp value between 0 and 100
  const clampedValue = Math.max(0, Math.min(100, value))
  const widthPercentage: DimensionValue = `${clampedValue}%`

  // Get background color (container)
  const getBackgroundColor = () => {
    if (isLight) {
      return colors.bg.light.subtle // gray[100]
    }
    return colors.bg.dark.subtle // gray[700] or similar
  }

  // Get progress fill color based on color variant
  const getFillColor = () => {
    switch (color) {
      case 'primary':
        return colors.primary[500]
      case 'gray':
        return isLight ? colors.gray[900] : colors.gray[100]
      case 'error':
        return colors.error[500]
      case 'success':
        return colors.emerald[500] // Using emerald as success color (from Figma: #10b978)
      default:
        return colors.primary[500]
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: getBackgroundColor() }, style]}>
      <View
        style={[
          styles.fill,
          {
            backgroundColor: getFillColor(),
            width: widthPercentage,
          },
          fillStyle,
        ]}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    height: 6,
    width: '100%',
    borderRadius: borderRadius.max,
    overflow: 'hidden',
    position: 'relative',
  },
  fill: {
    height: '100%',
    borderRadius: borderRadius.max,
  },
})

