/**
 * DEPRECATED: This DataTable component is incompatible with @scaffald/ui Table API
 *
 * This component was built using compound components (Table.Head, Table.Body, Table.Row, etc.)
 * which don't exist in @scaffald/ui. The @scaffald/ui Table is a complete component that
 * takes columns and data props instead.
 *
 * TODO: Rewrite this component to use @scaffald/ui Table API
 * See: /Users/clay/Development/UNI-Construct/packages/scaffald-ui/src/components/Table/Table.tsx
 *
 * The new Table API requires:
 * - columns: TableColumn[] - array of column definitions with id, title, width, etc.
 * - data: TableRowData[] - array of row data objects
 * - No compound components - just <Table columns={...} data={...} />
 *
 * Files using this component that need migration:
 * - packages/scf-core/features/office/payments/office-payment-analytics.tsx
 * - packages/scf-core/features/office/payments/OfficeTransactionHistory.tsx
 * - packages/scf-core/features/office/components/OfficePageLayout.tsx
 * - packages/scf-core/features/office/office-storage-dashboard.tsx
 * - packages/scf-core/features/office/legal/OfficeViolationReports.tsx
 * - packages/scf-core/features/connections/components/PendingRequestsList.tsx
 * - packages/scf-core/features/connections/components/ConnectionsList.tsx
 * - packages/scf-core/features/connections/components/FollowingList.tsx
 * - packages/scf-core/features/connections/components/FollowersList.tsx
 */

/* COMMENTED OUT - INCOMPATIBLE WITH @scaffald/ui

import { RowActionOverlay } from '@scf/core/features/office/components/RowActionOverlay'
import {
  ChevronDown,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  ChevronUp,
} from 'lucide-react-native'
import type { ColumnDef, Updater, VisibilityState } from '@tanstack/react-table'
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useRef, useState } from 'react'
import { Platform, ScrollView, View } from 'react-native'
import { Button, Input, Text } from '@scaffald/ui'
import { Table } from '@scaffald/ui'

const isWeb = Platform.OS === 'web'

const HEADER_ROW_HEIGHT = 48

export interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[]
  data: TData[]
  onRowView?: (row: TData) => void
  onRowEdit?: (row: TData) => void
  onRowDelete?: (row: TData) => Promise<void>
  onRowDuplicate?: (row: TData) => Promise<void>
  getItemName?: (row: TData) => string
  itemType?: string
  pageSize?: number
  isLoading?: boolean
  emptyMessage?: string
  cellWidth?: string
  cellHeight?: string
  hidePagination?: boolean
  testID?: string
  columnVisibility?: VisibilityState
  onColumnVisibilityChange?: (updater: Updater<VisibilityState>) => void
}

export function DataTable<TData>({
  columns,
  data,
  onRowView,
  onRowEdit,
  onRowDelete,
  onRowDuplicate,
  getItemName,
  itemType = 'item',
  pageSize = 50,
  isLoading = false,
  emptyMessage = 'No data available',
  cellWidth = '$15',
  cellHeight = '$5',
  hidePagination = false,
  testID,
  columnVisibility,
  onColumnVisibilityChange,
}: DataTableProps<TData>) {
  const [activeRowId, setActiveRowId] = useState<string | null>(null)
  const [overlayPosition, setOverlayPosition] = useState<{ x: number; y: number } | null>(null)
  const tableContainerRef = useRef<HTMLDivElement | null>(null)

  const useOverlay = isWeb && Boolean(onRowView || onRowEdit || onRowDelete || onRowDuplicate)
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize,
      },
    },
    ...(columnVisibility
      ? {
          state: {
            columnVisibility,
          },
          onColumnVisibilityChange,
        }
      : onColumnVisibilityChange
        ? { onColumnVisibilityChange }
        : {}),
  })

  const headerGroups = table.getHeaderGroups()
  const tableRows = table.getRowModel().rows

  const activeRow = activeRowId ? tableRows.find((row) => row.id === activeRowId)?.original : null

  const handleRowClick = (
    _row: TData,
    rowId: string,
    event?: {
      nativeEvent?: { clientX?: number; clientY?: number }
      clientX?: number
      clientY?: number
      currentTarget?: HTMLElement | null
    }
  ) => {
    if (useOverlay && isWeb) {
      let x = 0
      let y = 0

      if (event) {
        const clientX = event.nativeEvent?.clientX ?? event.clientX
        const clientY = event.nativeEvent?.clientY ?? event.clientY

        if (clientX !== undefined && clientY !== undefined) {
          const containerRect = (tableContainerRef.current as HTMLElement)?.getBoundingClientRect()
          if (containerRect) {
            x = clientX - containerRect.left
            y = clientY - containerRect.top
          }
        }
      }

      if (x === 0 && y === 0 && event?.currentTarget) {
        const rowElement = event.currentTarget as HTMLElement
        const rect = rowElement.getBoundingClientRect()
        const containerRect = (tableContainerRef.current as HTMLElement)?.getBoundingClientRect()
        if (containerRect) {
          x = rect.left - containerRect.left + rect.width / 2
          y = rect.top - containerRect.top + rect.height / 2
        }
      }

      if (x !== 0 || y !== 0) {
        setOverlayPosition({ x, y })
        setActiveRowId(rowId)
      }
    }
  }

  const handleCloseOverlay = () => {
    setActiveRowId(null)
    setOverlayPosition(null)
  }

  const handleEdit = (row: TData) => {
    onRowEdit?.(row)
    handleCloseOverlay()
  }

  const handleDelete = async (row: TData) => {
    if (onRowDelete) {
      await onRowDelete(row)
      handleCloseOverlay()
    }
  }

  const handleDuplicate = async (row: TData) => {
    if (onRowDuplicate) {
      await onRowDuplicate(row)
      handleCloseOverlay()
    }
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text>Loading...</Text>
      </View>
    )
  }

  if (tableRows.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text>{emptyMessage}</Text>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, flexDirection: "column", position: "relative" }}>
      <View ref={tableContainerRef} style={{ position: "relative", flex: 1 }}>
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator showsHorizontalScrollIndicator>
          <ScrollView horizontal>
            <View style={{ width: "100%" }}>
              <Table
                data-testid={testID}
                alignCells={{ x: 'left', y: 'center' }}
                alignHeaderCells={{ y: 'center', x: 'left' }}
                cellWidth={cellWidth as never}
                cellHeight={cellHeight as never}
                borderWidth={0.5}
                borderTopRightRadius={16}
                borderTopLeftRadius={16}
                borderBottomLeftRadius={8}
                borderBottomRightRadius={8}
              >
                <Table.Head position="absolute" top={0} zIndex={5} backgroundColor="$background">
                  {headerGroups.map((headerGroup, groupIndex) => (
                    <Table.Row
                      key={headerGroup.id}
                      backgrounded
                      backgroundColor="$color2"
                      rowLocation="first"
                      borderTopRightRadius={16}
                      borderTopLeftRadius={16}
                      position="absolute"
                      top={groupIndex * HEADER_ROW_HEIGHT}
                      zIndex={5 + groupIndex}
                    >
                      {headerGroup.headers.map((header, idx) => {
                        const cellLocation =
                          idx === 0
                            ? 'first'
                            : idx === headerGroup.headers.length - 1
                              ? 'last'
                              : 'middle'

                        if (header.isPlaceholder) {
                          return (
                            <Table.HeaderCell
                              key={header.id}
                              paddingLeft={12}
                              cellWidth={cellWidth as never}
                              cellLocation={cellLocation}
                            />
                          )
                        }

                        const columnMeta = header.column.columnDef.meta as
                          | { width?: string | number }
                          | undefined
                        const columnWidth = columnMeta?.width ?? cellWidth

                        return (
                          <Table.HeaderCell
                            key={header.id}
                            paddingLeft={12}
                            cellWidth={columnWidth as never}
                            cellLocation={cellLocation}
                          >
                            <View
                              flexDirection="row"
                              cursor={header.column.getCanSort() ? 'pointer' : 'default'}
                              onPress={
                                header.column.getCanSort()
                                  ? header.column.getToggleSortingHandler()
                                  : undefined
                              }
                              gap={8}
                              align="center"
                            >
                              <Text selectable={false}>
                                {flexRender(header.column.columnDef.header, header.getContext())}
                              </Text>
                              {header.column.getCanSort() &&
                                (header.column.getIsSorted() === 'asc' ? (
                                  <ChevronUp size={4} />
                                ) : header.column.getIsSorted() === 'desc' ? (
                                  <ChevronDown size={4} />
                                ) : (
                                  <ChevronsUpDown size={4} />
                                ))}
                            </View>
                          </Table.HeaderCell>
                        )
                      })}
                    </Table.Row>
                  ))}
                </Table.Head>

                <Table.Body>
                  {tableRows.map((row, rowIdx) => (
                    <Table.Row
                      key={row.id}
                      hoverStyle={{ backgroundColor: '$color2' }}
                      pressStyle={{ opacity: 0.8 }}
                      cursor={useOverlay ? 'pointer' : 'default'}
                      onPress={(event) => {
                        if (useOverlay) {
                          const webEvent = isWeb
                            ? (event as unknown as {
                                nativeEvent?: { clientX?: number; clientY?: number }
                                clientX?: number
                                clientY?: number
                                currentTarget?: HTMLElement | null
                              })
                            : undefined
                          handleRowClick(row.original, row.id, webEvent)
                        }
                      }}
                      rowLocation={rowIdx === tableRows.length - 1 ? 'last' : 'middle'}
                    >
                      {row.getVisibleCells().map((cell, cellIdx) => {
                        const columnMeta = cell.column.columnDef.meta as
                          | { width?: string | number }
                          | undefined
                        const columnWidth = columnMeta?.width ?? cellWidth

                        return (
                          <Table.Cell
                            key={cell.id}
                            paddingLeft={12}
                            cellWidth={columnWidth as never}
                            cellLocation={
                              cellIdx === 0
                                ? 'first'
                                : cellIdx === row.getVisibleCells().length - 1
                                  ? 'last'
                                  : 'middle'
                            }
                          >
                            <Text color="gray">
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </Text>
                          </Table.Cell>
                        )
                      })}
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table>
            </View>
          </ScrollView>
        </ScrollView>

        {useOverlay && activeRow && overlayPosition && onRowEdit && (
          <RowActionOverlay
            row={activeRow}
            position={overlayPosition}
            onView={
              onRowView
                ? (row) => {
                    onRowView(row)
                    handleCloseOverlay()
                  }
                : undefined
            }
            onEdit={handleEdit}
            onDelete={handleDelete}
            onDuplicate={onRowDuplicate ? handleDuplicate : undefined}
            onClose={handleCloseOverlay}
            itemName={
              getItemName
                ? getItemName(activeRow)
                : String(
                    (activeRow as { name?: string; title?: string }).name ||
                      (activeRow as { title?: string }).title ||
                      'Item'
                  )
            }
            itemType={itemType}
          />
        )}
      </View>

      {!hidePagination && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderTopWidth: 1,
            borderColor: "$borderColor",
            gap: 16,
          }}
        >
          <XGroup>
            <XGroup.Item>
              <Button
                size="sm"
                onPress={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <Button.Icon>
                  <ChevronFirst />
                </Button.Icon>
              </Button>
            </XGroup.Item>
            <XGroup.Item>
              <Button
                size="sm"
                onPress={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <Button.Icon>
                  <ChevronLeft />
                </Button.Icon>
              </Button>
            </XGroup.Item>
            <XGroup.Item>
              <Button size="sm" onPress={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                <Button.Icon>
                  <ChevronRight />
                </Button.Icon>
              </Button>
            </XGroup.Item>
            <XGroup.Item>
              <Button
                size="sm"
                onPress={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <Button.Icon>
                  <ChevronLast />
                </Button.Icon>
              </Button>
            </XGroup.Item>
          </XGroup>

          <Text>
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </Text>

          {isWeb && (
            <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
              <Text>Go to:</Text>
              <Input
                size="sm"
                width={20}
                keyboardType="numeric"
                defaultValue={String(table.getState().pagination.pageIndex + 1)}
                onChangeText={(text) => {
                  const page = text ? Number(text) - 1 : 0
                  table.setPageIndex(page)
                }}
              />
            </View>
          )}
        </View>
      )}
    </View>
  )
}

*/

// Temporary export to prevent import errors
import type { ColumnDef, Updater, VisibilityState } from '@tanstack/react-table'

export interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[]
  data: TData[]
  onRowView?: (row: TData) => void
  onRowEdit?: (row: TData) => void
  onRowDelete?: (row: TData) => Promise<void>
  onRowDuplicate?: (row: TData) => Promise<void>
  getItemName?: (row: TData) => string
  itemType?: string
  pageSize?: number
  isLoading?: boolean
  emptyMessage?: string
  cellWidth?: string
  cellHeight?: string
  hidePagination?: boolean
  testID?: string
  columnVisibility?: VisibilityState
  onColumnVisibilityChange?: (updater: Updater<VisibilityState>) => void
}

export function DataTable<TData>(_props: DataTableProps<TData>): never {
  throw new Error(
    'DataTable is deprecated and incompatible with @scaffald/ui. Please migrate to use @scaffald/ui Table component directly.'
  )
}