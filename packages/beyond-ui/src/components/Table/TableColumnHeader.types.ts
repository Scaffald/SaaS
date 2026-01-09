/**
 * TableColumnHeader component types
 */

import type { ViewStyle, TextStyle, PressableProps } from 'react-native'
import type React from 'react'

/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc' | null

/**
 * Column header state
 */
export type TableColumnHeaderState = 'default' | 'empty'

/**
 * Text alignment for header content
 */
export type TableColumnHeaderAlign = 'left' | 'center' | 'right'

/**
 * Table column header props
 */
export interface TableColumnHeaderProps extends Omit<PressableProps, 'style' | 'children'> {
  /**
   * Column title text
   */
  title?: string

  /**
   * Whether the column is sortable
   * @default false
   */
  sortable?: boolean

  /**
   * Current sort direction
   */
  sortDirection?: SortDirection

  /**
   * Callback when sort is triggered
   */
  onSort?: (direction: SortDirection) => void

  /**
   * Show checkbox for column selection
   * @default false
   */
  showCheckbox?: boolean

  /**
   * Checkbox checked state
   */
  checked?: boolean

  /**
   * Callback when checkbox state changes
   */
  onCheckboxChange?: (checked: boolean) => void

  /**
   * Show right icon (sort indicator)
   * @default true
   */
  showRightIcon?: boolean

  /**
   * Header state
   * @default 'default'
   */
  state?: TableColumnHeaderState

  /**
   * Column width
   */
  width?: number | string

  /**
   * Text alignment
   * @default 'left'
   */
  align?: TableColumnHeaderAlign

  /**
   * Custom container style
   */
  style?: ViewStyle

  /**
   * Custom text style
   */
  textStyle?: TextStyle

  /**
   * Custom content (overrides title)
   */
  children?: React.ReactNode
}
