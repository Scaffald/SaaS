/**
 * CancelIcon component
 * X/cancel icon for error states and dismissible elements
 * Uses View-based rendering for React Native compatibility
 *
 * @example
 * ```tsx
 * import { CancelIcon } from '@scaffald/ui'
 *
 * <CancelIcon size={16} color="#637083" />
 * ```
 */

import { View, } from 'react-native'
import type { ViewStyle } from 'react-native'
import { useThemeContext } from '../../theme'
import { colors } from '../../tokens/colors'

export interface CancelIconProps {
  /**
   * Icon size in pixels
   * @default 16
   */
  size?: number

  /**
   * Icon color
   * If not provided, uses theme-appropriate muted text color
   */
  color?: string

  /**
   * Custom container style
   */
  style?: ViewStyle
}

/**
 * Cancel/X icon
 * Two crossing lines forming an X shape
 */
export function CancelIcon({ size = 16, color, style }: CancelIconProps) {
  const { theme } = useThemeContext()
  const iconColor =
    color || (theme === 'light' ? colors.text.light.tertiary : colors.text.dark.tertiary)

  const lineWidth = size * 0.6
  const lineHeight = 1.5

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      {/* X shape - two crossing lines */}
      <View
        style={{
          position: 'absolute',
          width: lineWidth,
          height: lineHeight,
          backgroundColor: iconColor,
          transform: [{ rotate: '45deg' }],
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: lineWidth,
          height: lineHeight,
          backgroundColor: iconColor,
          transform: [{ rotate: '-45deg' }],
        }}
      />
    </View>
  )
}

