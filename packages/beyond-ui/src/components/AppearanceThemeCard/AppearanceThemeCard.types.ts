/**
 * AppearanceThemeCard component types
 */

import type { ViewStyle, PressableProps } from 'react-native'

export type AppearanceThemeCardVariant = 'light' | 'dark' | 'system'

export interface AppearanceThemeCardProps extends Omit<PressableProps, 'style'> {
  /**
   * Theme variant to display
   * @default 'light'
   */
  variant?: AppearanceThemeCardVariant

  /**
   * Whether this card is selected
   * @default false
   */
  selected?: boolean

  /**
   * Custom container style
   */
  style?: ViewStyle
}

export interface AppearanceThemeCardStyleConfig {
  container: ViewStyle
  preview: ViewStyle
  previewLight: ViewStyle
  previewDark: ViewStyle
  previewSystem: ViewStyle
  label: ViewStyle
}
