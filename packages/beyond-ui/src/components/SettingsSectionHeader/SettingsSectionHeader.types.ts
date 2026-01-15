/**
 * SettingsSectionHeader component types
 */

import type { ViewStyle, TextStyle } from 'react-native'
import type { IconComponent } from '../types'

export interface SettingsSectionHeaderProps {
  /**
   * Icon component to display
   */
  icon?: IconComponent

  /**
   * Section title
   */
  title: string

  /**
   * Section description/subtitle
   */
  description?: string

  /**
   * Custom container style
   */
  style?: ViewStyle

  /**
   * Custom title style
   */
  titleStyle?: TextStyle

  /**
   * Custom description style
   */
  descriptionStyle?: TextStyle
}

export interface SettingsSectionHeaderStyleConfig {
  container: ViewStyle
  iconContainer: ViewStyle
  textContainer: ViewStyle
  title: TextStyle
  description: TextStyle
}
