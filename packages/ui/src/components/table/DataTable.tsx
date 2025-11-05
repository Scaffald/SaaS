import type { ReactNode } from 'react'
import { Button, Input, ScrollView, Text, View, XGroup, isWeb } from 'tamagui'
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
} from '@tamagui/lucide-icons'
import type { ColumnDef } from '@tanstack/react-table'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table'
import { Table } from './TableParts'

export interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[]
  data: TData[]
  onRowClick?: (row: TData) => void
  pageSize?: number
  isLoading?: boolean
  emptyMessage?: string
  cellWidth?: string
  cellHeight?: string
  hidePagination?: boolean
  testID?: string
}

export function DataTable<TData>({
  columns,
  data,
  onRowClick,
  pageSize = 50,
  isLoading = false,
  emptyMessage = 'No data available',
  cellWidth = '$15',
  cellHeight = '$5',
  hidePagination = false,
  testID,
}: DataTableProps<TData>) {
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
  })

  const headerGroups = table.getHeaderGroups()
  const tableRows = table.getRowModel().rows

  if (isLoading) {
    return (
      <View flex={1} items="center" justify="center">
        <Text>Loading...</Text>
      </View>
    )
  }

  if (tableRows.length === 0) {
    return (
      <View flex={1} items="center" justify="center">
        <Text>{emptyMessage}</Text>
      </View>
    )
  }

  return (
    <View flex={1} flexDirection="column">
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
              <Table.Head>
                {headerGroups.map((headerGroup) => (
                  <Table.Row
                    key={headerGroup.id}
                    backgrounded
                    bg="$color2"
                    rowLocation="first"
                    borderTopRightRadius="$4"
                    borderTopLeftRadius="$4"
                  >
                    {headerGroup.headers.map((header, idx) => (
                      <Table.HeaderCell
                        key={header.id}
                        pl="$3"
                        cellLocation={
                          idx === 0
                            ? 'first'
                            : idx === headerGroup.headers.length - 1
                              ? 'last'
                              : 'middle'
                        }
                      >
                        <View
                          flexDirection="row"
                          cursor={header.column.getCanSort() ? 'pointer' : 'default'}
                          onPress={header.column.getToggleSortingHandler()}
                          gap="$2"
                          items="center"
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
                    ))}
                  </Table.Row>
                ))}
              </Table.Head>

              {/* Body */}
              <Table.Body>
                {tableRows.map((row, rowIdx) => (
                  <Table.Row
                    key={row.id}
                    hoverStyle={{ bg: '$color2' }}
                    pressStyle={{ opacity: 0.8 }}
                    cursor={onRowClick ? 'pointer' : 'default'}
                    onPress={() => onRowClick?.(row.original)}
                    rowLocation={rowIdx === tableRows.length - 1 ? 'last' : 'middle'}
                  >
                    {row.getVisibleCells().map((cell, cellIdx) => (
                      <Table.Cell
                        key={cell.id}
                        pl="$3"
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
                    ))}
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </View>
        </ScrollView>
      </ScrollView>

      {/* Pagination Footer */}
      {!hidePagination && (
        <View
          flexDirection="row"
          items="center"
          justify="space-between"
          px="$4"
          py="$3"
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
            <View flexDirection="row" gap="$2" items="center">
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
