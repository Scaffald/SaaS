/**
 * Row component types
 * Horizontal flex container (Row) types
 */

import type { ReactNode } from 'react'
import type { ViewStyle, ViewProps } from 'react-native'
import type {
  GapValue,
  PaddingValue,
  SpacingValue,
  AlignItems,
  JustifyContent,
  FlexWrap,
} from './Box.types'

/**
 * Row component props
 * Provides a horizontal flex container with convenient layout props
 */
export interface RowProps extends Omit<ViewProps, 'style'> {
  /** Child elements */
  children?: ReactNode

  // Spacing
  /** Gap between children (uses gap token) */
  gap?: GapValue
  /** Row gap for wrapped content */
  rowGap?: GapValue
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
  /** Align items on vertical axis (cross axis for row) */
  align?: AlignItems
  /** Justify content on horizontal axis (main axis for row) */
  justify?: JustifyContent
  /** Allow wrapping to multiple lines */
  wrap?: boolean | FlexWrap
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

  /** Custom style override */
  style?: ViewStyle
}
