/**
 * Spinner component
 * Loading indicator with size and color variants
 */

import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native'
import { colors } from '../../tokens/colors'
import type { SpinnerProps } from './Spinner.types'
import { useThemeContext } from '../../theme'
import { webStyle } from '../../utils/webStyles'

// iOS 26 spoke opacities (8 spokes, clockwise from top)
const IOS_SPOKE_OPACITIES = [1, 0.87, 0.75, 0.63, 0.51, 0.39, 0.27, 0.15]

function IOSSpinner({ size: dimension, color: spokeColor }: { size: number; color: string }) {
  const spokeWidth = Math.round(dimension * 0.133)  // ~4px at 30px
  const spokeHeight = Math.round(dimension * 0.333)  // ~10px at 30px
  const spokeRadius = spokeWidth / 2

  // Inject rotation animation
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    const styleId = 'ios-spinner-animation'
    if (!document.getElementById(styleId)) {
      const el = document.createElement('style')
      el.id = styleId
      el.textContent = `
        @keyframes ios-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `
      document.head.appendChild(el)
    }
  }

  return (
    <View
      style={[
        { width: dimension, height: dimension, position: 'relative' as const },
        Platform.OS === 'web'
          ? ({ animation: 'ios-spin 1s steps(8) infinite' } as unknown as import('react-native').ViewStyle)
          : undefined,
      ]}
    >
      {IOS_SPOKE_OPACITIES.map((opacity, i) => {
        const angle = i * 45
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              top: 0,
              left: (dimension - spokeWidth) / 2,
              width: spokeWidth,
              height: dimension / 2,
              alignItems: 'center',
              transform: [
                { translateX: 0 },
                { translateY: dimension / 2 },
                { rotate: `${angle}deg` },
                { translateY: -dimension / 2 },
              ],
            }}
          >
            <View
              style={{
                width: spokeWidth,
                height: spokeHeight,
                borderRadius: spokeRadius,
                backgroundColor: spokeColor,
                opacity,
              }}
            />
          </View>
        )
      })}
    </View>
  )
}

export function Spinner({ size = 'md', color = 'primary', variant = 'default', style, visible = true }: SpinnerProps) {
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

  // iOS 26 variant — 8-spoke activity indicator
  if (variant === 'ios') {
    const iosSize = size === 'xs' || size === 'sm' ? 22 : 30
    const iosColor = colors.labels[theme].secondary
    return (
      <View style={[styles.container, style]}>
        <IOSSpinner size={iosSize} color={iosColor} />
      </View>
    )
  }

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
            },
            webStyle({ animation: 'spin 1s linear infinite' }),
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
