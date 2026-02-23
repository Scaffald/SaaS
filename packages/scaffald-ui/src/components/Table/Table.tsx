/**
 * Table component
 * Comprehensive table component with sorting, selection, expansion, and pagination
 *
 * @example
 * ```tsx
 * import { Table } from '@scaffald/ui'
 *
 * const columns = [
 *   { id: 'name', title: 'Name', sortable: true },
 *   { id: 'email', title: 'Email' },
 *   { id: 'status', title: 'Status' },
 * ]
 *
 * const data = [
 *   { id: '1', name: 'John Doe', email: 'john@example.com', status: 'Active' },
 *   { id: '2', name: 'Jane Smith', email: 'jane@example.com', status: 'Inactive' },
 * ]
 *
 * <Table
 *   columns={columns}
 *   data={data}
 *   searchable
 *   sortable
 *   selectableRows
 *   expandableRows
 *   pagination={{ totalPages: 10, currentPage: 1 }}
 * />
 * ```
 */

import { useState, useMemo } from 'react'
import { View, Text, ScrollView, Pressable, Platform } from 'react-native'
import type { TableProps, TableSortConfig, TableSelectionConfig, TableExpansionConfig } from './Table.types'
import { getTableStyles } from './Table.styles'
import { useStyles } from '../../hooks'
import { useThemeContext } from '../../theme'
import { TableColumnHeader } from './TableColumnHeader'
import { TableCell } from './TableCell'
import { ExpandedTableRow } from './ExpandedTableRow'
import { Input } from '../Input'
import { Button } from '../Button'
import { Pagination } from '../Pagination'
import { colors } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import type { SortDirection } from './TableColumnHeader.types'

/**
 * Table component
 */
export function Table({
  columns,
  data,
  showHeader = true,
  searchable = false,
  searchPlaceholder = 'Search...',
  searchValue: controlledSearchValue,
  onSearchChange,
  actions = [],
  pagination,
  expandableRows = false,
  expansionConfig: controlledExpansionConfig,
  onRowExpand,
  selectableRows = false,
  selectionConfig: controlledSelectionConfig,
  onRowSelect,
  sortConfig: controlledSortConfig,
  onSort,
  renderExpandedRow,
  renderEmpty,
  renderLoading,
  loading = false,
  emptyMessage = 'No data available',
  style,
  headerStyle,
  bodyStyle,
  footerStyle,
  onRowPress,
  rowPressable = true,
  columnVisibility,
  pageSize,
  getRowId: getRowIdProp,
}: TableProps) {
  const { theme } = useThemeContext()
  const styles = useStyles(getTableStyles, [theme] as const)

  // Internal state for uncontrolled mode
  const [internalSearchValue, setInternalSearchValue] = useState('')
  const [internalSortConfig, setInternalSortConfig] = useState<TableSortConfig>({
    columnId: null,
    direction: null,
  })
  const [internalSelectionConfig, setInternalSelectionConfig] = useState<TableSelectionConfig>({
    selectedIds: new Set<string>(),
    mode: 'multiple',
    allSelected: false,
    indeterminate: false,
  })
  const [internalExpansionConfig, setInternalExpansionConfig] = useState<TableExpansionConfig>({
    expandedIds: new Set<string>(),
    allowMultiple: false,
  })
  const [internalPage, setInternalPage] = useState(1)

  // Use controlled or uncontrolled values
  const searchValue = controlledSearchValue !== undefined ? controlledSearchValue : internalSearchValue
  const sortConfig = controlledSortConfig || internalSortConfig
  const selectionConfig = controlledSelectionConfig || internalSelectionConfig
  const expansionConfig = controlledExpansionConfig || internalExpansionConfig

  // Handle search change
  const handleSearchChange = (value: string) => {
    if (controlledSearchValue === undefined) {
      setInternalSearchValue(value)
    }
    onSearchChange?.(value)
  }

  // Handle sort
  const handleSort = (columnId: string, direction: SortDirection) => {
    if (!controlledSortConfig) {
      setInternalSortConfig({ columnId, direction })
    }
    onSort?.(columnId, direction)
  }

  // Handle row selection
  const handleRowSelect = (rowId: string, selected: boolean) => {
    const newSelectedIds = new Set(selectionConfig.selectedIds)
    if (selected) {
      if (selectionConfig.mode === 'single') {
        newSelectedIds.clear()
      }
      newSelectedIds.add(rowId)
    } else {
      newSelectedIds.delete(rowId)
    }

    if (!controlledSelectionConfig) {
      setInternalSelectionConfig({
        ...selectionConfig,
        selectedIds: newSelectedIds,
        allSelected: newSelectedIds.size === data.length && data.length > 0,
        indeterminate: newSelectedIds.size > 0 && newSelectedIds.size < data.length,
      })
    }

    onRowSelect?.(Array.from(newSelectedIds))
  }

  // Handle select all
  const handleSelectAll = (selected: boolean) => {
    const newSelectedIds = selected ? new Set(data.map((row) => row.id || String(row))) : new Set<string>()

    if (!controlledSelectionConfig) {
      setInternalSelectionConfig({
        ...selectionConfig,
        selectedIds: newSelectedIds,
        allSelected: selected,
        indeterminate: false,
      })
    }

    onRowSelect?.(Array.from(newSelectedIds))
  }

  // Handle row expansion
  const handleRowExpand = (rowId: string, expanded: boolean) => {
    const newExpandedIds = new Set(expansionConfig.expandedIds)
    if (expanded) {
      if (!expansionConfig.allowMultiple) {
        newExpandedIds.clear()
      }
      newExpandedIds.add(rowId)
    } else {
      newExpandedIds.delete(rowId)
    }

    if (!controlledExpansionConfig) {
      setInternalExpansionConfig({
        ...expansionConfig,
        expandedIds: newExpandedIds,
      })
    }

    onRowExpand?.(rowId, expanded)
  }

  // Filter columns by visibility
  const visibleColumns = useMemo(() => {
    if (!columnVisibility) return columns
    return columns.filter((col) => columnVisibility[col.id] !== false)
  }, [columns, columnVisibility])

  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!searchValue.trim()) return data

    const searchLower = searchValue.toLowerCase()
    return data.filter((row) => {
      return visibleColumns.some((col) => {
        const value = row[col.id]
        if (value === null || value === undefined) return false
        return String(value).toLowerCase().includes(searchLower)
      })
    })
  }, [data, visibleColumns, searchValue])

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig.columnId || !sortConfig.direction) return filteredData

    const column = visibleColumns.find((col) => col.id === sortConfig.columnId)
    if (!column) return filteredData

    return [...filteredData].sort((a, b) => {
      const aValue = a[column.id]
      const bValue = b[column.id]

      // Handle null/undefined
      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1

      // String comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }

      // Number comparison
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue
      }

      // Default: convert to string
      const aStr = String(aValue)
      const bStr = String(bValue)
      return sortConfig.direction === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr)
    })
  }, [filteredData, sortConfig, visibleColumns])

  // Client-side pagination
  const paginatedData = useMemo(() => {
    if (!pageSize || pageSize <= 0) return sortedData
    const currentPage = pagination?.currentPage ?? internalPage
    const start = (currentPage - 1) * pageSize
    return sortedData.slice(start, start + pageSize)
  }, [sortedData, pageSize, pagination?.currentPage, internalPage])

  const totalPages = useMemo(() => {
    if (!pageSize || pageSize <= 0) return 1
    return Math.max(1, Math.ceil(sortedData.length / pageSize))
  }, [sortedData.length, pageSize])

  const displayData = pageSize ? paginatedData : sortedData

  // Handle page change for client-side pagination
  const handlePageChange = (page: number) => {
    if (pagination?.currentPage === undefined) {
      setInternalPage(page)
    }
    pagination?.onPageChange?.(page)
  }

  // Calculate total column width for proper horizontal scrolling
  const totalColumnWidth = useMemo(() => {
    return visibleColumns.reduce((sum, col) => {
      if (typeof col.width === 'number') {
        return sum + col.width
      }
      return sum + 150 // Default width for columns without explicit width
    }, 0)
  }, [visibleColumns])

  // Render loading state
  if (loading && renderLoading) {
    return (
      <View style={[styles.container, style]}>
        {renderLoading()}
      </View>
    )
  }

  // Render empty state
  if (displayData.length === 0 && sortedData.length === 0) {
    if (renderEmpty) {
      return (
        <View style={[styles.container, style]}>
          {showHeader && (
            <View style={[styles.header, headerStyle]}>
              <View style={styles.headerContent}>
                {searchable && (
                  <Input
                    placeholder={searchPlaceholder}
                    value={searchValue}
                    onChangeText={handleSearchChange}
                    style={{ flex: 1, maxWidth: 263 }}
                  />
                )}
                {actions.length > 0 && (
                  <View style={styles.headerActions}>
                    {actions.map((action, index) => (
                      <Button
                        key={index}
                        variant={action.variant}
                        color={action.color}
                        size={action.size}
                        iconStart={action.icon}
                        onPress={action.onPress}
                        disabled={action.disabled}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </View>
                )}
              </View>
            </View>
          )}
          <View style={[styles.body, bodyStyle]}>
            {renderEmpty()}
          </View>
        </View>
      )
    }

    return (
      <View style={[styles.container, style]}>
        {showHeader && (
          <View style={[styles.header, headerStyle]}>
            <View style={styles.headerContent}>
              {searchable && (
                <Input
                  placeholder={searchPlaceholder}
                  value={searchValue}
                  onChangeText={handleSearchChange}
                  style={{ flex: 1, maxWidth: 263 }}
                />
              )}
              {actions.length > 0 && (
                <View style={styles.headerActions}>
                  {actions.map((action, index) => (
                    <Button
                      key={index}
                      variant={action.variant}
                      color={action.color}
                      size={action.size}
                      iconStart={action.icon}
                      onPress={action.onPress}
                      disabled={action.disabled}
                    >
                      {action.label}
                    </Button>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}
        <View style={[styles.body, bodyStyle, { padding: spacing[32], alignItems: 'center', justifyContent: 'center' }]}>
          <Text style={{ color: colors.text[theme].secondary, fontSize: 14 }}>
            {emptyMessage}
          </Text>
        </View>
      </View>
    )
  }

  return (
    <View style={[styles.container, style]}>
      {/* Header */}
      {showHeader && (
        <View style={[styles.header, headerStyle]}>
          <View style={styles.headerContent}>
            {searchable && (
              <Input
                placeholder={searchPlaceholder}
                value={searchValue}
                onChangeText={handleSearchChange}
                style={{ flex: 1, maxWidth: 263 }}
              />
            )}
            {actions.length > 0 && (
              <View style={styles.headerActions}>
                {actions.map((action, index) => (
                  <Button
                    key={index}
                    variant={action.variant}
                    color={action.color}
                    size={action.size}
                    iconStart={action.icon}
                    onPress={action.onPress}
                    disabled={action.disabled}
                  >
                    {action.label}
                  </Button>
                ))}
              </View>
            )}
          </View>
        </View>
      )}

      {/* Body */}
      <ScrollView style={[styles.body, bodyStyle]} horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ width: totalColumnWidth || '100%', minWidth: totalColumnWidth }}>
          {/* Column Headers */}
          <View style={{ flexDirection: 'row' }}>
            {visibleColumns.map((column, _colIndex) => {
              // Check if this column should show select all checkbox
              // Look for the first column with showCheckbox set
              const selectColumn = visibleColumns.find((col) => col.showCheckbox)
              const showSelectAllCheckbox =
                selectableRows && column.showCheckbox && column.id === selectColumn?.id

              return (
                <TableColumnHeader
                  key={column.id}
                  title={column.title}
                  sortable={column.sortable}
                  sortDirection={sortConfig.columnId === column.id ? sortConfig.direction : null}
                  onSort={(direction) => handleSort(column.id, direction || null)}
                  showCheckbox={showSelectAllCheckbox}
                  checked={selectionConfig.allSelected}
                  onCheckboxChange={handleSelectAll}
                  showRightIcon={column.sortable}
                  state={column.headerEmpty ? 'empty' : 'default'}
                  width={column.width}
                  align={column.align}
                  style={{ flexShrink: 0, minWidth: typeof column.width === 'number' ? column.width : undefined }}
                />
              )
            })}
          </View>

          {/* Rows */}
          {displayData.map((row, rowIndex) => {
            const getRowId = getRowIdProp ?? ((r, i) => r.id ?? String(i))
            const rowId = getRowId(row, rowIndex)
            const isExpanded = expansionConfig.expandedIds.has(rowId)
            const isSelected = selectionConfig.selectedIds.has(rowId)
            const isPressable = onRowPress && rowPressable

            const rowContent = (
              <View style={{ flexDirection: 'row' }}>
                  {visibleColumns.map((column) => {
                    const cellValue = row[column.id]
                    const cellType = column.cellType || 'text-default'

                    // Render custom cell if render function provided
                    if (column.render) {
                      return (
                        <TableCell
                          key={column.id}
                          type={cellType}
                          width={column.width}
                          align={column.align}
                          style={{ flexShrink: 0, minWidth: typeof column.width === 'number' ? column.width : undefined }}
                          {...({ children: column.render(cellValue, row, rowIndex) } as any)}
                        />
                      )
                    }

                    // Render selection cell if this column has showCheckbox
                    if (selectableRows && column.showCheckbox) {
                      return (
                        <TableCell
                          key={column.id}
                          type="checkbox-only"
                          width={column.width}
                          checked={isSelected}
                          onSelectionChange={(checked) => handleRowSelect(rowId, checked)}
                          style={{ flexShrink: 0, minWidth: typeof column.width === 'number' ? column.width : undefined }}
                        />
                      )
                    }

                    // Render expansion icon - check if this is the expansion column
                    // Typically the first column without a title or with empty title when expandable
                    if (expandableRows && (!column.title || column.title === '') && column.width === 40) {
                      return (
                        <TableCell
                          key={column.id}
                          type={isExpanded ? 'icon-close' : 'icon-open'}
                          width={column.width}
                          onIconPress={() => handleRowExpand(rowId, !isExpanded)}
                          style={{ flexShrink: 0, minWidth: typeof column.width === 'number' ? column.width : undefined }}
                        />
                      )
                    }

                    // Skip rendering if column is empty state
                    if (column.headerEmpty) {
                      return (
                        <TableCell 
                          key={column.id} 
                          type="empty" 
                          width={column.width}
                          style={{ flexShrink: 0, minWidth: typeof column.width === 'number' ? column.width : undefined }}
                        />
                      )
                    }

                    // Render regular cell
                    return (
                      <TableCell
                        key={column.id}
                        type={cellType}
                        width={column.width}
                        align={column.align}
                        style={{ flexShrink: 0, minWidth: typeof column.width === 'number' ? column.width : undefined }}
                        {...({ text: cellValue !== null && cellValue !== undefined ? String(cellValue) : '' } as any)}
                      />
                    )
                  })}
                </View>
            )

            return (
              <View key={rowId}>
                {/* Regular row */}
                {isPressable ? (
                  <Pressable
                    onPress={() => onRowPress?.(row, rowIndex)}
                    style={({ pressed }) => [
                      { opacity: pressed ? 0.8 : 1 },
                      Platform.OS === 'web' && { cursor: 'pointer' as const },
                    ]}
                  >
                    {rowContent}
                  </Pressable>
                ) : (
                  rowContent
                )}

                {/* Expanded row */}
                {isExpanded && (
                  <View>
                    {renderExpandedRow ? (
                      renderExpandedRow(row, rowIndex)
                    ) : (
                      <ExpandedTableRow
                        variant={row.expandedVariant || 'variant2'}
                        title={typeof row.expandedData === 'object' && row.expandedData !== null && 'title' in row.expandedData
                          ? String(row.expandedData.title)
                          : undefined}
                        infoItems={
                          typeof row.expandedData === 'object' && row.expandedData !== null && 'items' in row.expandedData
                            ? (row.expandedData.items as Array<{ label: string; value: string }>)
                            : undefined
                        }
                      />
                    )}
                  </View>
                )}
              </View>
            )
          })}
        </View>
      </ScrollView>

      {/* Footer with Pagination */}
      {(pagination || (pageSize && totalPages > 1)) && (
        <View style={[styles.footer, footerStyle]}>
          <Pagination
            {...pagination}
            totalPages={pageSize ? totalPages : (pagination?.totalPages ?? 1)}
            currentPage={pageSize ? internalPage : pagination?.currentPage}
            onPageChange={pageSize ? handlePageChange : pagination?.onPageChange}
          />
        </View>
      )}
    </View>
  )
}
