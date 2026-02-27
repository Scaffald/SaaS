/**
 * Stack component types
 * Vertical flex container (Stack) types
 */

import type { ReactNode } from 'react'
import type { ViewStyle, ViewProps } from 'react-native'
import type { GapValue, PaddingValue, SpacingValue, AlignItems, JustifyContent } from './Box.types'

/**
 * Stack component props
 * Provides a vertical flex container with convenient layout props
 */
export interface StackProps extends Omit<ViewProps, 'style'> {
  /** Child elements */
  children?: ReactNode

  // Spacing
  /** Gap between children (uses gap token) */
  gap?: GapValue
  /** Padding on all sides */
  padding?: PaddingValue
  /** Horizontal padding (left and right) */
  paddingHorizontal?: PaddingValue
  /** Vertical padding (top and bottom) */
  paddingVertical?: PaddingValue
  /** Padding top */
  paddingTop?: PaddingValue
  /** Padding bottom */
  paddingBottom?: PaddingValue
  /** Padding left */
  paddingLeft?: PaddingValue
  /** Padding right */
  paddingRight?: PaddingValue
  /** Margin on all sides */
  margin?: SpacingValue
  /** Horizontal margin */
  marginHorizontal?: SpacingValue
  /** Vertical margin */
  marginVertical?: SpacingValue
  /** Margin top */
  marginTop?: SpacingValue
  /** Margin bottom */
  marginBottom?: SpacingValue
  /** Margin left */
  marginLeft?: SpacingValue
  /** Margin right */
  marginRight?: SpacingValue

  // Flexbox
  /** Align items on horizontal axis (cross axis for column) */
  align?: AlignItems
  /** Justify content on vertical axis (main axis for column) */
  justify?: JustifyContent
  /** Flex value */
  flex?: number
  /** Flex grow */
  flexGrow?: number
  /** Flex shrink */
  flexShrink?: number
  /** Align self */
  alignSelf?: AlignItems | 'auto'

  // Dimensions
  /** Width */
  width?: number | string
  /** Height */
  height?: number | string
  /** Minimum width */
  minWidth?: number | string
  /** Maximum width */
  maxWidth?: number | string
  /** Minimum height */
  minHeight?: number | string
  /** Maximum height */
  maxHeight?: number | string

  // Appearance
  /** Background color */
  backgroundColor?: string
  /** Border radius */
  borderRadius?: number
  /** Border width */
  borderWidth?: number
  /** Border color */
  borderColor?: string

  /** Custom style override */
  style?: ViewStyle
}
