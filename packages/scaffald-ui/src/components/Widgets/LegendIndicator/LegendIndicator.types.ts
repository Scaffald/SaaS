/**
 * Legend Indicator component types
 */

import type { ViewStyle } from 'react-native'

/**
 * Legend item data
 */
export interface LegendItem {
  /**
   * Item label text
   */
  label: string

  /**
   * Item color (hex code or color token)
   */
  color: string
}

/**
 * Legend Indicator props
 */
export interface LegendIndicatorProps {
  /**
   * Array of legend items
   */
  items: LegendItem[]

  /**
   * Orientation of legend
   * @default 'horizontal'
   */
  orientation?: 'horizontal' | 'vertical'

  /**
   * Custom container style
   */
  style?: ViewStyle
}
