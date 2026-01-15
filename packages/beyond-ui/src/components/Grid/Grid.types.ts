/**
 * Grid component types
 * CSS Grid-based layout component with responsive breakpoints
 */

import type { ViewStyle } from 'react-native'
import type { ResponsiveValue } from '../../hooks/useResponsive'

// Gap value types
export type GapValue = 'none' | '3xs' | '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | number

export type GridAutoFlow = 'row' | 'column' | 'dense' | 'row-dense' | 'column-dense'
export type GridJustifyItems = 'start' | 'end' | 'center' | 'stretch'
export type GridAlignItems = 'start' | 'end' | 'center' | 'stretch' | 'baseline'
export type GridJustifyContent = 'start' | 'end' | 'center' | 'stretch' | 'space-between' | 'space-around' | 'space-evenly'
export type GridAlignContent = 'start' | 'end' | 'center' | 'stretch' | 'space-between' | 'space-around' | 'space-evenly'

export interface GridProps {
  /**
   * Number of columns in the grid
   * Supports responsive values: { base: 1, sm: 2, md: 3, lg: 4, xl: 6 }
   * @default 12
   */
  columns?: number | ResponsiveValue<number>

  /**
   * Number of rows in the grid
   * Supports responsive values
   */
  rows?: number | ResponsiveValue<number>

  /**
   * Gap between grid items (both row and column)
   * Supports responsive values: { base: 'sm', md: 'md', lg: 'lg' }
   */
  gap?: GapValue | ResponsiveValue<GapValue>

  /**
   * Gap between columns
   * Overrides gap for columns
   */
  columnGap?: GapValue | ResponsiveValue<GapValue>

  /**
   * Gap between rows
   * Overrides gap for rows
   */
  rowGap?: GapValue | ResponsiveValue<GapValue>

  /**
   * Controls how auto-placed items are flowed in the grid
   * @default 'row'
   */
  autoFlow?: GridAutoFlow

  /**
   * Alignment of grid items along the inline (row) axis
   * @default 'stretch'
   */
  justifyItems?: GridJustifyItems

  /**
   * Alignment of grid items along the block (column) axis
   * @default 'stretch'
   */
  alignItems?: GridAlignItems

  /**
   * Alignment of the grid within its container along the inline axis
   */
  justifyContent?: GridJustifyContent

  /**
   * Alignment of the grid within its container along the block axis
   */
  alignContent?: GridAlignContent

  /**
   * Minimum column width for auto-fill/auto-fit columns
   * Example: '200px' creates as many columns as fit with min 200px width
   */
  minColumnWidth?: string | number

  /**
   * Children elements (grid items)
   */
  children?: React.ReactNode

  /**
   * Container style
   */
  style?: ViewStyle

  /**
   * Test ID for testing
   */
  testID?: string
}

export interface GridItemProps {
  /**
   * Column span (how many columns this item should occupy)
   * Supports responsive values: { base: 1, md: 2, lg: 3 }
   */
  colSpan?: number | ResponsiveValue<number>

  /**
   * Row span (how many rows this item should occupy)
   * Supports responsive values
   */
  rowSpan?: number | ResponsiveValue<number>

  /**
   * Column start position (1-indexed)
   * Supports responsive values
   */
  colStart?: number | ResponsiveValue<number>

  /**
   * Column end position (1-indexed)
   * Supports responsive values
   */
  colEnd?: number | ResponsiveValue<number>

  /**
   * Row start position (1-indexed)
   * Supports responsive values
   */
  rowStart?: number | ResponsiveValue<number>

  /**
   * Row end position (1-indexed)
   * Supports responsive values
   */
  rowEnd?: number | ResponsiveValue<number>

  /**
   * Alignment of this specific item along the inline axis
   * Overrides justifyItems from Grid
   */
  justifySelf?: GridJustifyItems

  /**
   * Alignment of this specific item along the block axis
   * Overrides alignItems from Grid
   */
  alignSelf?: GridAlignItems

  /**
   * Children elements
   */
  children?: React.ReactNode

  /**
   * Item style
   */
  style?: ViewStyle

  /**
   * Test ID for testing
   */
  testID?: string
}
