import { RowActionOverlay } from '@scf/core/features/office/components/RowActionOverlay'
import {
  ChevronDown,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  ChevronUp,
} from '@tamagui/lucide-icons'
import type { ColumnDef, Updater, VisibilityState } from '@tanstack/react-table'
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useRef, useState } from 'react'
import { Button, Input, isWeb, ScrollView, Text, View, XGroup } from '@unicornlove/beyond-ui'
import { Table } from '@unicornlove/beyond-ui'

const HEADER_ROW_HEIGHT = 48

export interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[]
  data: TData[]
  /** View action handler (opens overlay on row click) */
  onRowView?: (row: TData) => void
  /** Edit action handler (opens overlay on row click) */
  onRowEdit?: (row: TData) => void
  /** Delete action handler (opens overlay on row click) */
  onRowDelete?: (row: TData) => Promise<void>
  /** Duplicate action handler (opens overlay on row click) */
  onRowDuplicate?: (row: TData) => Promise<void>
  /** Function to get item name from row data (for delete confirmation) */
  getItemName?: (row: TData) => string
  /** Type of item (for delete confirmation) */
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

  // Determine if we should use overlay (new props) or old onRowClick behavior
  // Note: Overlay only works on web due to RowActionOverlay using DOM APIs
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

  // Find active row data
  const activeRow = activeRowId ? tableRows.find((row) => row.id === activeRowId)?.original : null

  // Handle row click - calculate position and open overlay
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
      // Calculate position relative to table container
      // Try to get position from event or from row element
      let x = 0
      let y = 0

      if (event) {
        // Try to get position from mouse/touch event
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

      // Fallback: position at row center if we couldn't get event position
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

  // Close overlay handler
  const handleCloseOverlay = () => {
    setActiveRowId(null)
    setOverlayPosition(null)
  }

  // Handle overlay actions
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
      <View flex={1} alignItems="center" justifyContent="center">
        <Text>Loading...</Text>
      </View>
    )
  }

  if (tableRows.length === 0) {
    return (
      <View flex={1} alignItems="center" justifyContent="center">
        <Text>{emptyMessage}</Text>
      </View>
    )
  }

  return (
    <View flex={1} flexDirection="column" position="relative">
      <View ref={tableContainerRef} position="relative" flex={1}>
        <ScrollView flex={1} showsVerticalScrollIndicator showsHorizontalScrollIndicator>
          <ScrollView horizontal>
            <View width="100%">
              <Table
                data-testid={testID}
                alignCells={{ x: 'left', y: 'center' }}
                alignHeaderCells={{ y: 'center', x: 'left' }}
                cellWidth={cellWidth as never}
                cellHeight={cellHeight as never}
                borderWidth={0.5}
                borderTopRightRadius="$4"
                borderTopLeftRadius="$4"
                borderBottomLeftRadius="$2"
                borderBottomRightRadius="$2"
              >
                {/* Header */}
                <Table.Head position="absolute" top={0} zIndex={5} backgroundColor="$background">
                  {headerGroups.map((headerGroup, groupIndex) => (
                    <Table.Row
                      key={headerGroup.id}
                      backgrounded
                      backgroundColor="$color2"
                      rowLocation="first"
                      borderTopRightRadius="$4"
                      borderTopLeftRadius="$4"
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
                              paddingLeft="$3"
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
                            paddingLeft="$3"
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
                              gap="$2"
                              alignItems="center"
                            >
                              <Text fontSize="$4" selectable={false}>
                                {flexRender(header.column.columnDef.header, header.getContext())}
                              </Text>
                              {header.column.getCanSort() &&
                                (header.column.getIsSorted() === 'asc' ? (
                                  <ChevronUp size="$1" />
                                ) : header.column.getIsSorted() === 'desc' ? (
                                  <ChevronDown size="$1" />
                                ) : (
                                  <ChevronsUpDown size="$1" />
                                ))}
                            </View>
                          </Table.HeaderCell>
                        )
                      })}
                    </Table.Row>
                  ))}
                </Table.Head>

                {/* Body */}
                <Table.Body>
                  {tableRows.map((row, rowIdx) => (
                    <Table.Row
                      key={row.id}
                      hoverStyle={{ backgroundColor: '$color2' }}
                      pressStyle={{ opacity: 0.8 }}
                      cursor={useOverlay ? 'pointer' : 'default'}
                      onPress={(event) => {
                        if (useOverlay) {
                          // Convert native event to web-compatible format
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
                            paddingLeft="$3"
                            cellWidth={columnWidth as never}
                            cellLocation={
                              cellIdx === 0
                                ? 'first'
                                : cellIdx === row.getVisibleCells().length - 1
                                  ? 'last'
                                  : 'middle'
                            }
                          >
                            <Text fontSize="$4" color="$color11">
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

        {/* Row Action Overlay */}
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

      {/* Pagination Footer */}
      {!hidePagination && (
        <View
          flexDirection="row"
          alignItems="center"
          justifyContent="space-between"
          paddingHorizontal="$4"
          paddingVertical="$3"
          borderTopWidth={1}
          borderColor="$borderColor"
          gap="$4"
          $sm={{
            flexDirection: 'column',
          }}
        >
          <XGroup>
            <XGroup.Item>
              <Button
                size="$3"
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
                size="$3"
                onPress={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <Button.Icon>
                  <ChevronLeft />
                </Button.Icon>
              </Button>
            </XGroup.Item>
            <XGroup.Item>
              <Button size="$3" onPress={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                <Button.Icon>
                  <ChevronRight />
                </Button.Icon>
              </Button>
            </XGroup.Item>
            <XGroup.Item>
              <Button
                size="$3"
                onPress={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <Button.Icon>
                  <ChevronLast />
                </Button.Icon>
              </Button>
            </XGroup.Item>
          </XGroup>

          <Text fontSize="$3">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </Text>

          {isWeb && (
            <View flexDirection="row" gap="$2" alignItems="center">
              <Text fontSize="$3">Go to:</Text>
              <Input
                size="$3"
                width="$5"
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
