/**
 * Spacer component types
 * Flexible space that expands to fill available space
 */

import type { ViewStyle, ViewProps } from 'react-native'
import type { SpacingValue } from './Box.types'

/**
 * Spacer component props
 */
export interface SpacerProps extends Omit<ViewProps, 'style'> {
  /**
   * Fixed size in pixels or spacing token
   * When provided, the spacer has a fixed size instead of flexing
   */
  size?: SpacingValue

  /**
   * Flex value (default: 1)
   * Higher values make the spacer take more space relative to other spacers
   */
  flex?: number

  /** Custom style override */
  style?: ViewStyle
}
