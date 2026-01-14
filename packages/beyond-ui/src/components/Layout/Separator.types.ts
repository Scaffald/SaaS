/**
 * Separator component types
 * Visual divider for separating content
 */

import type { ViewStyle, ViewProps } from 'react-native'
import type { SpacingValue } from './Box.types'

/**
 * Separator orientation
 */
export type SeparatorOrientation = 'horizontal' | 'vertical'

/**
 * Separator thickness
 */
export type SeparatorThickness = 'thin' | 'medium' | 'thick' | number

/**
 * Separator component props
 */
export interface SeparatorProps extends Omit<ViewProps, 'style'> {
  /**
   * Orientation of the separator
   * @default 'horizontal'
   */
  orientation?: SeparatorOrientation

  /**
   * Thickness of the separator line
   * @default 'thin' (1px)
   */
  thickness?: SeparatorThickness

  /**
   * Color of the separator
   * @default uses dividerColor token
   */
  color?: string

  /**
   * Length of the separator (width for horizontal, height for vertical)
   * Use '100%' or a specific pixel value
   * @default '100%'
   */
  length?: number | string

  /**
   * Margin around the separator (uses spacing tokens)
   */
  margin?: SpacingValue

  /**
   * Vertical margin (top and bottom)
   */
  marginVertical?: SpacingValue

  /**
   * Horizontal margin (left and right)
   */
  marginHorizontal?: SpacingValue

  /** Custom style override */
  style?: ViewStyle
}
