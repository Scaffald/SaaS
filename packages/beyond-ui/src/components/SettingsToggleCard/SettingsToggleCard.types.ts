/**
 * SettingsToggleCard component types
 */

import type { ViewStyle, PressableProps } from 'react-native'
import type { IconComponent } from '../types'

export interface SettingsToggleCardProps extends Omit<PressableProps, 'style'> {
  /**
   * Icon component to display
   */
  icon?: IconComponent

  /**
   * Card title
   */
  title: string

  /**
   * Card description
   */
  description?: string

  /**
   * Whether the toggle is enabled
   * @default false
   */
  enabled?: boolean

  /**
   * Callback when toggle state changes
   */
  onToggleChange?: (enabled: boolean) => void

  /**
   * Whether the card is disabled
   * @default false
   */
  disabled?: boolean

  /**
   * Custom container style
   */
  style?: ViewStyle
}

export interface SettingsToggleCardStyleConfig {
  container: ViewStyle
  content: ViewStyle
  iconContainer: ViewStyle
  textContainer: ViewStyle
  title: ViewStyle
  description: ViewStyle
}
