/**
 * SliderHandle component
 * Draggable handle for the slider with states
 */

import { View, StyleSheet, Platform } from 'react-native'
import type { ViewStyle } from 'react-native'
import { colors } from '../../tokens/colors'
import { useThemeContext } from '../../theme'
import type { SliderColor, SliderHandleState } from './Slider.types'

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

const HANDLE_SIZE = 16 // 16px diameter from Figma

export function SliderHandle({
  state = 'default',
  color = 'primary',
  disabled = false,
  style,
}: SliderHandleProps) {
  const { theme } = useThemeContext()
  const isLight = theme === 'light'

  const getBorderColor = (): string => {
    if (disabled) {
      return isLight ? colors.gray[300] : colors.gray[600]
    }

    if (state === 'active') {
      if (color === 'primary') {
        return colors.primary[500]
      }
      // Gray active: darker border
      return isLight ? colors.gray[900] : colors.gray[100]
    }

    // Default state: lighter border
    return isLight ? colors.gray[200] : colors.gray[600]
  }

  const baseStyle: ViewStyle = {
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    borderRadius: HANDLE_SIZE / 2,
    borderWidth: 2,
    borderColor: getBorderColor(),
    backgroundColor: colors.white,
  }

  const webStyle = Platform.OS === 'web'
    ? ({
        cursor: disabled ? 'not-allowed' : 'pointer',
        userSelect: 'none',
      } as any)
    : {}

  return (
    <View
      style={[
        styles.handle,
        baseStyle,
        disabled && styles.disabled,
        webStyle,
        style,
      ]}
    />
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

