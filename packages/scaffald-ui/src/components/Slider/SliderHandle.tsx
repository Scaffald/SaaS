/**
 * SliderHandle component
 * Draggable handle for the slider with states
 */

import { View, StyleSheet, Platform } from 'react-native'
import type { ViewStyle } from 'react-native'
import { colors } from '../../tokens/colors'
import { useThemeContext } from '../../theme'
import type { SliderColor, SliderHandleState } from './Slider.types'
import { webStyle } from '../../utils/webStyles'

export interface SliderHandleProps {
  /**
   * Handle state
   * @default 'default'
   */
  state?: SliderHandleState

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
   * Custom style for the handle
   */
  style?: ViewStyle
}

const HANDLE_SIZE = 28 // 28px diameter — iOS 26 thumb size

export function SliderHandle({
  state = 'default',
  color = 'primary',
  disabled = false,
  style,
}: SliderHandleProps) {
  const { theme } = useThemeContext()
  const isLight = theme === 'light'

  // iOS 26: White circle thumb with shadow, no visible border
  const baseStyle: ViewStyle = {
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    borderRadius: HANDLE_SIZE / 2,
    backgroundColor: colors.white,
    // iOS 26 thumb shadow
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.15)' } as ViewStyle
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 4,
          elevation: 3,
        }),
  }

  const webHandleStyle = webStyle({
    cursor: disabled ? 'not-allowed' : 'pointer',
    userSelect: 'none',
  })

  return (
    <View style={[styles.handle, baseStyle, disabled && styles.disabled, webHandleStyle, style]} />
  )
}

const styles = StyleSheet.create({
  handle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
})
