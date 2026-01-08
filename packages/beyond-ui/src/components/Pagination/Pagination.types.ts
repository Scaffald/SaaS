import type { ViewStyle } from 'react-native'

/**
 * Pagination component props
 */
export interface PaginationProps {
  /**
   * Total number of pages
   */
  totalPages: number

  /**
   * Current page (controlled mode)
   * Use this when you want to control the pagination state externally
   */
  currentPage?: number

  /**
   * Default page (uncontrolled mode)
   * @default 1
   */
  defaultPage?: number

  /**
   * Callback fired when the page changes
   * @param page - The new page number
   */
  onPageChange?: (page: number) => void

  /**
   * Type of pagination display
   * - 'numbers': Shows page numbers with ellipsis (1, 2, ..., 7, 8)
   * - 'label': Shows text label ("Page X of Y")
   * @default 'numbers'
   */
  type?: PaginationType

  /**
   * Horizontal alignment of the pagination component
   * @default 'center'
   */
  position?: PaginationPosition

  /**
   * Border radius style for page number buttons
   * - 'square': 8px border radius
   * - 'rounded': Fully rounded (pill shape)
   * @default 'rounded'
   */
  pageRadius?: PaginationRadius

  /**
   * Show text labels on navigation buttons ("Previous"/"Next")
   * When false, shows only icons
   * @default false
   */
  showNavText?: boolean

  /**
   * Show borders on navigation buttons
   * @default false
   */
  showNavBorder?: boolean

  /**
   * Number of page buttons to show on each side of the current page
   * @default 1
   */
  siblingCount?: number

  /**
   * Number of page buttons to always show at the start and end
   * @default 1
   */
  boundaryCount?: number

  /**
   * Disable all pagination interactions
   * @default false
   */
  disabled?: boolean

  /**
   * Custom style for the pagination container
   */
  style?: ViewStyle

  /**
   * Custom style for page number buttons
   */
  pageButtonStyle?: ViewStyle

  /**
   * Custom style for navigation buttons
   */
  navButtonStyle?: ViewStyle
}

/**
 * Pagination display type
 */
export type PaginationType = 'numbers' | 'label'

/**
 * Pagination position/alignment
 */
export type PaginationPosition = 'left' | 'center' | 'right'

/**
 * Page button border radius style
 */
export type PaginationRadius = 'square' | 'rounded'
