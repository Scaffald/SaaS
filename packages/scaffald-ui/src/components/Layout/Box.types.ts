/**
 * Box component types
 * Base container component for layout primitives
 */

import type { ReactNode } from 'react'
import type { ViewStyle, ViewProps } from 'react-native'
import type { spacing, gap, padding } from '../../tokens/spacing'
import type { ResponsiveValue } from '../../hooks/useResponsive'

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
 * Responsive spacing value - can be static or responsive
 */
export type ResponsiveSpacingValue = SpacingValue | ResponsiveValue<SpacingValue>

/**
 * Responsive gap value - can be static or responsive
 */
export type ResponsiveGapValue = GapValue | ResponsiveValue<GapValue>

/**
 * Responsive padding value - can be static or responsive
 */
export type ResponsivePaddingValue = PaddingValue | ResponsiveValue<PaddingValue>

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
  /** Gap between children (uses gap token) - supports responsive values */
  gap?: ResponsiveGapValue
  /** Row gap for wrapped content - supports responsive values */
  rowGap?: ResponsiveGapValue
  /** Column gap for wrapped content - supports responsive values */
  columnGap?: ResponsiveGapValue
  /** Padding on all sides - supports responsive values */
  padding?: ResponsivePaddingValue
  /** Horizontal padding (left and right) - supports responsive values */
  paddingHorizontal?: ResponsivePaddingValue
  /** Vertical padding (top and bottom) - supports responsive values */
  paddingVertical?: ResponsivePaddingValue
  /** Top padding - supports responsive values */
  paddingTop?: ResponsivePaddingValue
  /** Bottom padding - supports responsive values */
  paddingBottom?: ResponsivePaddingValue
  /** Left padding - supports responsive values */
  paddingLeft?: ResponsivePaddingValue
  /** Right padding - supports responsive values */
  paddingRight?: ResponsivePaddingValue
  /** Margin on all sides - supports responsive values */
  margin?: ResponsiveSpacingValue
  /** Horizontal margin (left and right) - supports responsive values */
  marginHorizontal?: ResponsiveSpacingValue
  /** Vertical margin (top and bottom) - supports responsive values */
  marginVertical?: ResponsiveSpacingValue
  /** Top margin - supports responsive values */
  marginTop?: ResponsiveSpacingValue
  /** Bottom margin - supports responsive values */
  marginBottom?: ResponsiveSpacingValue
  /** Left margin - supports responsive values */
  marginLeft?: ResponsiveSpacingValue
  /** Right margin - supports responsive values */
  marginRight?: ResponsiveSpacingValue

  // Flexbox
  /** Flex direction - supports responsive values */
  direction?: FlexDirection | ResponsiveValue<FlexDirection>
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
