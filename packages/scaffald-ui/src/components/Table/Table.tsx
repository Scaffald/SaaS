/**
 * Table component
 * Comprehensive table component with sorting, selection, expansion, and pagination
 * Features virtualization and sticky headers for high-performance SaaS data grids.
 */

import { useCallback, useMemo } from 'react'
import { View, Text, ScrollView, Pressable, Platform, FlatList } from 'react-native'
import type { TableProps, TableRowData } from './Table.types'
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
import { useTable } from './useTable'

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

  const table = useTable({
    columns,
    data,
    searchValue: controlledSearchValue,
    onSearchChange,
    sortConfig: controlledSortConfig,
    onSort,
    selectionConfig: controlledSelectionConfig,
    onRowSelect,
    expansionConfig: controlledExpansionConfig,
    onRowExpand,
    pageSize,
    pagination,
    columnVisibility,
  })

  // Calculate total column width for proper horizontal scrolling
  const totalColumnWidth = useMemo(
    () =>
      table.visibleColumns.reduce((sum, col) => {
        if (typeof col.width === 'number') {
          return sum + col.width
        }
        return sum + 150 // Default width
      }, 0),
    [table.visibleColumns]
  )

  const renderRow = useCallback(({ item: row, index: rowIndex }: { item: TableRowData; index: number }) => {
    const getRowId = getRowIdProp ?? ((r, i) => r.id ?? String(i))
    const rowId = getRowId(row, rowIndex)
    const isExpanded = table.expansionConfig.expandedIds.has(rowId)
    const isSelected = table.selectionConfig.selectedIds.has(rowId)
    const isPressable = onRowPress && rowPressable

    const rowContent = (
      <View style={{ flexDirection: 'row' }}>
        {table.visibleColumns.map((column) => {
          const cellValue = row[column.id]
          const cellType = column.cellType || 'text-default'

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

          if (selectableRows && column.showCheckbox) {
            return (
              <TableCell
                key={column.id}
                type="checkbox-only"
                width={column.width}
                checked={isSelected}
                onSelectionChange={(checked: boolean) => table.handleRowSelect(rowId, checked)}
                style={{ flexShrink: 0, minWidth: typeof column.width === 'number' ? column.width : undefined }}
              />
            )
          }

          if (expandableRows && (!column.title || column.title === '') && column.width === 40) {
            return (
              <TableCell
                key={column.id}
                type={isExpanded ? 'icon-close' : 'icon-open'}
                width={column.width}
                onIconPress={() => table.handleRowExpand(rowId, !isExpanded)}
                style={{ flexShrink: 0, minWidth: typeof column.width === 'number' ? column.width : undefined }}
              />
            )
          }

          if (column.headerEmpty) {
            return <TableCell key={column.id} type="empty" width={column.width} />
          }

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
  }, [
    getRowIdProp,
    table,
    onRowPress,
    rowPressable,
    selectableRows,
    expandableRows,
    renderExpandedRow,
  ])

  const renderHeader = useCallback(() => (
    <View style={{ flexDirection: 'row', backgroundColor: colors.bg[theme].default }}>
      {table.visibleColumns.map((column) => {
        const selectColumn = table.visibleColumns.find((col) => col.showCheckbox)
        const showSelectAllCheckbox =
          selectableRows && column.showCheckbox && column.id === selectColumn?.id

        return (
          <TableColumnHeader
            key={column.id}
            title={column.title}
            sortable={column.sortable}
            sortDirection={table.sortConfig.columnId === column.id ? table.sortConfig.direction : null}
            onSort={(direction) => table.handleSort(column.id, direction || null)}
            showCheckbox={showSelectAllCheckbox}
            checked={table.selectionConfig.allSelected}
            onCheckboxChange={table.handleSelectAll}
            showRightIcon={column.sortable}
            state={column.headerEmpty ? 'empty' : 'default'}
            width={column.width}
            align={column.align}
            style={{ flexShrink: 0, minWidth: typeof column.width === 'number' ? column.width : undefined }}
          />
        )
      })}
    </View>
  ), [table, selectableRows, theme])

  if (loading && renderLoading) {
    return <View style={[styles.container, style]}>{renderLoading()}</View>
  }

  if (table.displayData.length === 0) {
    return (
      <View style={[styles.container, style]}>
        {showHeader && (
          <View style={[styles.header, headerStyle]}>
            <View style={styles.headerContent}>
              {searchable && (
                <Input
                  placeholder={searchPlaceholder}
                  value={table.searchValue}
                  onChangeText={table.handleSearchChange}
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
          {renderEmpty ? renderEmpty() : (
            <Text style={{ color: colors.text[theme].secondary, fontSize: 14 }}>
              {emptyMessage}
            </Text>
          )}
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
                value={table.searchValue}
                onChangeText={table.handleSearchChange}
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

      <ScrollView style={[styles.body, bodyStyle]} horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ width: totalColumnWidth || '100%', minWidth: totalColumnWidth }}>
          <FlatList
            data={table.displayData}
            renderItem={renderRow}
            keyExtractor={(item, index) => getRowIdProp?.(item, index) ?? item.id ?? String(index)}
            ListHeaderComponent={renderHeader}
            stickyHeaderIndices={[0]}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={Platform.OS !== 'web'}
            initialNumToRender={10}
            maxToRenderPerBatch={5}
            windowSize={5}
          />
        </View>
      </ScrollView>

      {(pagination || (pageSize && table.totalPages > 1)) && (
        <View style={[styles.footer, footerStyle]}>
          <Pagination
            {...pagination}
            totalPages={pageSize ? table.totalPages : (pagination?.totalPages ?? 1)}
            currentPage={table.currentPage}
            onPageChange={table.handlePageChange}
          />
        </View>
      )}
    </View>
  )
}
