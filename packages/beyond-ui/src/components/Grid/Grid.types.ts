/**
 * Grid component types
 * CSS Grid layout component for responsive layouts
 */

import type { ReactNode } from 'react'
import type { ViewStyle, ViewProps } from 'react-native'
import type { ResponsiveValue } from '../../hooks/useResponsive'
import type { GapValue } from '../Layout/Box.types'

/**
 * Grid auto-flow options
 */
export type GridAutoFlow = 'row' | 'column' | 'row-dense' | 'column-dense'

/**
 * Grid template columns value
 * Can be a number of columns or a custom template string
 */
export type GridTemplateColumns = number | string

/**
 * Grid template rows value
 * Can be a number of rows or a custom template string
 */
export type GridTemplateRows = number | string

/**
 * Grid component props
 */
export interface GridProps extends Omit<ViewProps, 'style'> {
  /** Child elements */
  children?: ReactNode

  /** Number of columns or custom template - supports responsive values */
  columns?: GridTemplateColumns | ResponsiveValue<GridTemplateColumns>

  /** Number of rows or custom template - supports responsive values */
  rows?: GridTemplateRows | ResponsiveValue<GridTemplateRows>

  /** Gap between grid items (applies to both row and column) - supports responsive values */
  gap?: GapValue | ResponsiveValue<GapValue>

  /** Row gap between grid items - supports responsive values */
  rowGap?: GapValue | ResponsiveValue<GapValue>

  /** Column gap between grid items - supports responsive values */
  columnGap?: GapValue | ResponsiveValue<GapValue>

  /** Grid auto-flow direction */
  autoFlow?: GridAutoFlow

  /** Justify items alignment */
  justifyItems?: 'start' | 'end' | 'center' | 'stretch'

  /** Align items alignment */
  alignItems?: 'start' | 'end' | 'center' | 'stretch' | 'baseline'

  /** Justify content alignment */
  justifyContent?:
    | 'start'
    | 'end'
    | 'center'
    | 'stretch'
    | 'space-between'
    | 'space-around'
    | 'space-evenly'

  /** Align content alignment */
  alignContent?:
    | 'start'
    | 'end'
    | 'center'
    | 'stretch'
    | 'space-between'
    | 'space-around'
    | 'space-evenly'

  /** Custom style override */
  style?: ViewStyle
}

/**
 * GridItem component props
 * Optional wrapper for grid items with placement control
 */
export interface GridItemProps extends Omit<ViewProps, 'style'> {
  /** Child elements */
  children?: ReactNode

  /** Column start position */
  colStart?: number

  /** Column end position */
  colEnd?: number

  /** Column span */
  colSpan?: number

  /** Row start position */
  rowStart?: number

  /** Row end position */
  rowEnd?: number

  /** Row span */
  rowSpan?: number

  /** Justify self alignment */
  justifySelf?: 'start' | 'end' | 'center' | 'stretch'

  /** Align self alignment */
  alignSelf?: 'start' | 'end' | 'center' | 'stretch' | 'baseline'

  /** Custom style override */
  style?: ViewStyle
}
