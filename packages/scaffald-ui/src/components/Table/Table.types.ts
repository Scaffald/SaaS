/**
 * Table component types
 * Comprehensive type definitions for table configuration
 */

import type { ViewStyle } from 'react-native'
import type React from 'react'
import type { TableCellType } from './TableCell.types'
import type { SortDirection } from './TableColumnHeader.types'
import type { ExpandedTableRowVariant } from './ExpandedTableRow.types'
import type { PaginationProps } from '../Pagination'
import type { ButtonProps } from '../Button'

/**
 * Table column definition
 */
export interface TableColumn {
  /**
   * Unique column identifier
   */
  id: string

  /**
   * Column title text
   */
  title: string

  /**
   * Column width (number in pixels or string percentage)
   */
  width?: number | string

  /**
   * Text alignment
   * @default 'left'
   */
  align?: 'left' | 'center' | 'right'

  /**
   * Whether the column is sortable
   * @default false
   */
  sortable?: boolean

  /**
   * Default cell type for this column
   */
  cellType?: TableCellType

  /**
   * Custom render function for cell content
   * Receives the cell value and entire row data
   */
  render?: (value: unknown, row: TableRowData, rowIndex: number) => React.ReactNode

  /**
   * Show checkbox in column header
   * @default false
   */
  showCheckbox?: boolean

  /**
   * Whether column header is in empty state
   * @default false
   */
  headerEmpty?: boolean
}

/**
 * Table row data
 * Generic type for row data - users can provide any data structure
 */
export type TableRowData = Record<string, unknown> & {
  /**
   * Unique row identifier (optional but recommended)
   */
  id?: string

  /**
   * Whether row is expanded
   */
  expanded?: boolean

  /**
   * Whether row is selected
   */
  selected?: boolean

  /**
   * Expanded row variant (if expandable)
   */
  expandedVariant?: ExpandedTableRowVariant

  /**
   * Expanded row content data
   */
  expandedData?: unknown
}

/**
 * Table header action button
 */
export interface TableHeaderAction {
  /**
   * Button label/text
   */
  label: string

  /**
   * Button variant
   * @default 'primary'
   */
  variant?: ButtonProps['variant']

  /**
   * Button color
   * @default 'primary'
   */
  color?: ButtonProps['color']

  /**
   * Button size
   * @default 'md'
   */
  size?: ButtonProps['size']

  /**
   * Icon component (optional)
   */
  icon?: React.ComponentType<{ size: number; color: string }>

  /**
   * Callback when button is pressed
   */
  onPress: () => void

  /**
   * Whether button is disabled
   */
  disabled?: boolean
}

/**
 * Table sorting configuration
 */
export interface TableSortConfig {
  /**
   * Column ID that is currently sorted
   */
  columnId: string | null

  /**
   * Sort direction
   */
  direction: SortDirection
}

/**
 * Table selection configuration
 */
export interface TableSelectionConfig {
  /**
   * Selected row IDs
   */
  selectedIds: Set<string>

  /**
   * Selection mode
   * @default 'multiple'
   */
  mode?: 'single' | 'multiple'

  /**
   * Whether all rows are selected
   */
  allSelected?: boolean

  /**
   * Whether selection is indeterminate (some rows selected)
   */
  indeterminate?: boolean
}

/**
 * Table expansion configuration
 */
export interface TableExpansionConfig {
  /**
   * Expanded row IDs
   */
  expandedIds: Set<string>

  /**
   * Whether multiple rows can be expanded at once
   * @default false
   */
  allowMultiple?: boolean
}

/**
 * Table props
 */
export interface TableProps {
  /**
   * Column definitions
   */
  columns: TableColumn[]

  /**
   * Table data rows
   */
  data: TableRowData[]

  /**
   * Show table header section (search and actions)
   * @default true
   */
  showHeader?: boolean

  /**
   * Enable search functionality
   * @default false
   */
  searchable?: boolean

  /**
   * Search input placeholder
   * @default 'Search...'
   */
  searchPlaceholder?: string

  /**
   * Current search value (controlled)
   */
  searchValue?: string

  /**
   * Callback when search value changes
   */
  onSearchChange?: (value: string) => void

  /**
   * Header action buttons
   */
  actions?: TableHeaderAction[]

  /**
   * Pagination configuration
   */
  pagination?: PaginationProps

  /**
   * Enable row expansion
   * @default false
   */
  expandableRows?: boolean

  /**
   * Expansion configuration (controlled)
   */
  expansionConfig?: TableExpansionConfig

  /**
   * Callback when row expansion changes
   */
  onRowExpand?: (rowId: string, expanded: boolean) => void

  /**
   * Enable row selection
   * @default false
   */
  selectableRows?: boolean

  /**
   * Selection configuration (controlled)
   */
  selectionConfig?: TableSelectionConfig

  /**
   * Callback when row selection changes
   */
  onRowSelect?: (rowIds: string[]) => void

  /**
   * Sorting configuration (controlled)
   */
  sortConfig?: TableSortConfig

  /**
   * Callback when sort changes
   */
  onSort?: (columnId: string, direction: SortDirection) => void

  /**
   * Custom render function for expanded row content
   */
  renderExpandedRow?: (row: TableRowData, rowIndex: number) => React.ReactNode

  /**
   * Custom render function for empty state
   */
  renderEmpty?: () => React.ReactNode

  /**
   * Custom render function for loading state
   */
  renderLoading?: () => React.ReactNode

  /**
   * Whether table is in loading state
   * @default false
   */
  loading?: boolean

  /**
   * Empty state message
   * @default 'No data available'
   */
  emptyMessage?: string

  /**
   * Custom container style
   */
  style?: ViewStyle

  /**
   * Custom header style
   */
  headerStyle?: ViewStyle

  /**
   * Custom body style
   */
  bodyStyle?: ViewStyle

  /**
   * Custom footer style
   */
  footerStyle?: ViewStyle

  /**
   * Callback when a row is pressed
   */
  onRowPress?: (row: TableRowData, rowIndex: number) => void

  /**
   * Show pressable cursor/hover on rows when onRowPress is provided
   * @default true when onRowPress is set
   */
  rowPressable?: boolean

  /**
   * Column visibility - hide columns by id
   * Keys are column ids, values are visibility (true = visible)
   */
  columnVisibility?: Record<string, boolean>

  /**
   * Client-side pagination: number of rows per page
   * When set, table slices data and shows built-in pagination
   */
  pageSize?: number

  /**
   * Get unique row ID (default: row.id ?? String(index))
   */
  getRowId?: (row: TableRowData, index: number) => string
}
