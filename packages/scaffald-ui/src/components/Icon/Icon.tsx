/**
 * Icon wrapper component
 * Provides consistent icon rendering with size and color management
 *
 * @example
 * ```tsx
 * import { Icon } from '@scaffald/ui'
 * import { MyIcon } from 'lucide-react-native'
 *
 * <Icon component={MyIcon} size={20} color="#637083" />
 * ```
 */

import { View } from 'react-native'
import type { ViewStyle } from 'react-native'
import type React from 'react'

export interface IconProps {
  /**
   * Icon component to render (must accept size and color props)
   */
  component: React.ComponentType<{ size: number; color: string }>

  /**
   * Icon size in pixels
   * @default 20
   */
  size?: number

  /**
   * Icon color
   * @default '#637083' (gray-500)
   */
  color?: string

  /**
   * Custom container style
   */
  style?: ViewStyle
}

/**
 * Icon wrapper component
 * Wraps icon components with consistent sizing and styling
 */
export function Icon({ component: Component, size = 20, color = '#637083', style }: IconProps) {
  return (
    <View style={[{ width: size, height: size }, style]}>
      <Component size={size} color={color} />
    </View>
  )
}

