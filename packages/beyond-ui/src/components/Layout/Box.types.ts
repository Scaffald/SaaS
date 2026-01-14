/**
 * Box component types
 * Base container component for layout primitives
 */

import type { ReactNode } from 'react'
import type { ViewStyle, ViewProps } from 'react-native'
import type { spacing, gap, padding } from '../../tokens/spacing'

/**
 * Spacing value can be a direct number or a token key
 */
export type SpacingValue = number | keyof typeof spacing

/**
 * Gap value can be a direct number or a gap token key
 */
export type GapValue = number | keyof typeof gap

/**
 * Padding value can be a direct number or a padding token key
 */
export type PaddingValue = number | keyof typeof padding

/**
 * Alignment options for flexbox
 */
export type AlignItems = 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline'

/**
 * Justify content options for flexbox
 */
export type JustifyContent =
  | 'flex-start'
  | 'flex-end'
  | 'center'
  | 'space-between'
  | 'space-around'
  | 'space-evenly'

/**
 * Flex direction options
 */
export type FlexDirection = 'row' | 'row-reverse' | 'column' | 'column-reverse'

/**
 * Flex wrap options
 */
export type FlexWrap = 'wrap' | 'nowrap' | 'wrap-reverse'

/**
 * Position options
 */
export type Position = 'relative' | 'absolute'

/**
 * Box component props
 * Provides a flexible container with common layout props
 */
export interface BoxProps extends Omit<ViewProps, 'style'> {
  /** Child elements */
  children?: ReactNode

  // Spacing
  /** Gap between children (uses gap token) */
  gap?: GapValue
  /** Row gap for wrapped content */
  rowGap?: GapValue
  /** Column gap for wrapped content */
  columnGap?: GapValue
  /** Padding on all sides */
  padding?: PaddingValue
  /** Horizontal padding (left and right) */
  paddingHorizontal?: PaddingValue
  /** Vertical padding (top and bottom) */
  paddingVertical?: PaddingValue
  /** Top padding */
  paddingTop?: PaddingValue
  /** Bottom padding */
  paddingBottom?: PaddingValue
  /** Left padding */
  paddingLeft?: PaddingValue
  /** Right padding */
  paddingRight?: PaddingValue
  /** Margin on all sides */
  margin?: SpacingValue
  /** Horizontal margin (left and right) */
  marginHorizontal?: SpacingValue
  /** Vertical margin (top and bottom) */
  marginVertical?: SpacingValue
  /** Top margin */
  marginTop?: SpacingValue
  /** Bottom margin */
  marginBottom?: SpacingValue
  /** Left margin */
  marginLeft?: SpacingValue
  /** Right margin */
  marginRight?: SpacingValue

  // Flexbox
  /** Flex direction */
  direction?: FlexDirection
  /** Align items on cross axis */
  align?: AlignItems
  /** Justify content on main axis */
  justify?: JustifyContent
  /** Flex wrap */
  wrap?: FlexWrap
  /** Flex grow/shrink/basis shorthand */
  flex?: number
  /** Flex grow */
  flexGrow?: number
  /** Flex shrink */
  flexShrink?: number
  /** Flex basis */
  flexBasis?: number | string
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

  // Position
  /** Position type */
  position?: Position
  /** Top position */
  top?: number | string
  /** Bottom position */
  bottom?: number | string
  /** Left position */
  left?: number | string
  /** Right position */
  right?: number | string
  /** Z-index */
  zIndex?: number

  // Appearance
  /** Background color */
  backgroundColor?: string
  /** Border radius */
  borderRadius?: number
  /** Overflow behavior */
  overflow?: 'visible' | 'hidden' | 'scroll'

  /** Custom style override */
  style?: ViewStyle
}
