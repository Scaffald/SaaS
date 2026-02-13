/**
 * InfoIcon component
 * Circle with "i" icon for information tooltips
 * Based on Figma design specification (18px default, uses muted gray)
 *
 * @example
 * ```tsx
 * import { InfoIcon } from '@scaffald/ui'
 *
 * <InfoIcon size={18} color="#637083" />
 * ```
 */

import { View, Text, } from 'react-native'
import type { ViewStyle, } from 'react-native'

export interface InfoIconProps {
  /**
   * Icon size in pixels
   * @default 18
   */
  size?: number

  /**
   * Icon color (border and text)
   * @default '#637083' (gray-500)
   */
  color?: string

  /**
   * Custom container style
   */
  style?: ViewStyle
}

/**
 * Info icon - circle with "i" letter
 * Used for information tooltips and help indicators
 */
export function InfoIcon({ size = 18, color = '#637083', style }: InfoIconProps) {
  const borderWidth = 1.5
  const borderRadius = size / 2
  const fontSize = size * 0.56 // Approximately 10px for 18px icon
  const textLineHeight = fontSize

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius,
          borderWidth,
          borderColor: color,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <Text
        style={{
          fontSize,
          fontWeight: '700',
          color,
          lineHeight: textLineHeight,
        }}
      >
        i
      </Text>
    </View>
  )
}

