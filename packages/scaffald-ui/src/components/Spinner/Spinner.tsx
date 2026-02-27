/**
 * Spinner component
 * Loading indicator with size and color variants
 */

import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native'
import { colors } from '../../tokens/colors'
import type { SpinnerProps } from './Spinner.types'
import { useThemeContext } from '../../theme'

export function Spinner({
  size = 'md',
  color = 'primary',
  style,
  visible = true,
}: SpinnerProps) {
  const { theme } = useThemeContext()
  const isLight = theme === 'light'

  if (!visible) return null

  // Get spinner size in pixels based on size prop
  const getSpinnerSize = (): number => {
    switch (size) {
      case 'xs':
        return 48
      case 'sm':
        return 64
      case 'md':
        return 80
      case 'lg':
        return 96
      case 'xl':
        return 128
      default:
        return 80
    }
  }

  // Get spinner color based on color variant
  const getSpinnerColor = (): string => {
    if (color === 'primary') {
      return colors.primary[500]
    }
    // Gray color
    return isLight ? colors.gray[900] : colors.gray[100]
  }

  const spinnerSize = getSpinnerSize()
  const spinnerColor = getSpinnerColor()

  // For web, use CSS-based spinner for better animation
  // Calculate border width based on size (thicker for larger spinners)
  const getBorderWidth = (): number => {
    switch (size) {
      case 'xs':
        return 3
      case 'sm':
        return 3.5
      case 'md':
        return 4
      case 'lg':
        return 4.5
      case 'xl':
        return 5
      default:
        return 4
    }
  }

  if (Platform.OS === 'web') {
    const borderWidth = getBorderWidth()

    // Inject CSS animation if not already present
    if (typeof document !== 'undefined') {
      const styleId = 'spinner-spin-animation'
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style')
        style.id = styleId
        style.textContent = `
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `
        document.head.appendChild(style)
      }
    }

    return (
      <View style={[styles.container, style]}>
        <View
          style={[
            styles.webSpinner,
            {
              width: spinnerSize,
              height: spinnerSize,
              borderWidth,
              borderColor: spinnerColor,
              borderTopColor: 'transparent',
              borderRightColor: 'transparent',
              borderRadius: spinnerSize / 2,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              animation: 'spin 1s linear infinite',
            } as any,
          ]}
        />
      </View>
    )
  }

  // For native, use ActivityIndicator with custom size
  // ActivityIndicator only supports 'small' and 'large', so we'll use a View wrapper
  return (
    <View style={[styles.container, style]}>
      <View
        style={{
          width: spinnerSize,
          height: spinnerSize,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator size="large" color={spinnerColor} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  webSpinner: {
    borderRadius: 9999,
  },
})

