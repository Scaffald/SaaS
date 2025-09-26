import {
  ChevronDown,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsUpDown,
  Search,
} from '@tamagui/lucide-icons'
import type {
  ColumnDef,
  PaginationState,
  SortingState,
  Table as TanstackTable,
} from '@tanstack/react-table'
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import {
  Button,
  Input,
  ScrollView,
  Text,
  View,
  XGroup,
  XStack,
  YStack,
  getTokenValue,
  isWeb,
  useMedia,
  useWindowDimensions,
} from 'tamagui'

import { Table } from './common/tableParts'

type AlignOption = 'start' | 'center' | 'end'

type DataTableColumnMeta = {
  width?: number | string
  align?: AlignOption
  wrapWithText?: boolean
}

export type DataTableColumn<TData extends Record<string, any>> = {
  /**
   * Unique identifier for the column. When omitted the key or index will be used.
   */
  id?: string
  /**
   * Property key from the row object to display. Optional when using a custom accessor.
   */
  key?: keyof TData
  /**
   * Header label displayed in the table head. Defaults to a start-cased version of the id.
   */
  header?: ReactNode
  /**
   * Toggle column sorting. Defaults to true unless an accessor can't be derived.
   */
  sortable?: boolean
  /**
   * Desired column width. Accepts Tamagui size tokens or pixel values.
   */
  width?: number | string
  /**
   * Alignment for header and cell content.
   */
  align?: AlignOption
  /**
   * Custom accessor for the column. When omitted the row key will be used.
   */
  accessor?: (row: TData) => unknown
  /**
   * Custom renderer for the cell value. Receives the accessor value and the full row.
   */
  renderCell?: (value: unknown, row: TData) => ReactNode
  /**
   * Optional filter value used for global search. Defaults to the accessor output.
   */
  filterValue?: (row: TData) => string | string[]
  /**
   * Opt out of global search for this column.
   */
  searchable?: boolean
}

export type DataTableToolbarContext = {
  searchValue: string
  setSearchValue: (value: string) => void
  searchInput: ReactNode
  totalItems: number
  visibleItems: number
}

export type DataTableEmptyStateContext = {
  totalItems: number
  visibleItems: number
}

export type DataTableProps<TData extends Record<string, any>> = {
  data: TData[]
  columns: DataTableColumn<TData>[]
  pageSize?: number
  defaultSort?: { key: string; desc?: boolean }
  searchPlaceholder?: string
  searchableColumns?: string[]
  renderToolbar?: (context: DataTableToolbarContext) => ReactNode
  renderEmptyState?: (context: DataTableEmptyStateContext) => ReactNode
}

const DEFAULT_CELL_WIDTH = '$15'

const formatHeader = (value: string) => {
  return value
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

const resolveColumnId = <TData extends Record<string, any>>(
  column: DataTableColumn<TData>,
  index: number,
) => {
  if (column.id) return column.id
  if (column.key) return String(column.key)
  return `column-${index}`
}

const resolveAccessor = <TData extends Record<string, any>>(
  column: DataTableColumn<TData>,
): ((row: TData) => unknown) => {
  if (column.accessor) return column.accessor
  if (column.key) {
    return (row: TData) => row[column.key as keyof TData]
  }
  return () => null
}

const resolveColumnWidth = (value?: number | string) => {
  if (!value) {
    return getTokenValue(DEFAULT_CELL_WIDTH)
  }

  if (typeof value === 'number') {
    return value
  }

  const tokenValue = getTokenValue(value as any)
  return typeof tokenValue === 'number' ? tokenValue : getTokenValue(DEFAULT_CELL_WIDTH)
}

const alignToJustify: Record<AlignOption, 'flex-start' | 'center' | 'flex-end'> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
}

const FooterContainer = ({
  children,
  Footer,
}: {
  children: ReactNode
  Footer: React.ElementType
}) => {
  if (!isWeb) {
    return (
      <>
        {children}
        <Footer />
      </>
    )
  }

  return <>{children}</>
}

const DataTablePagination = <TData,>({
  table,
  screenWidth,
  tableWidth,
  itemCount,
}: {
  table: TanstackTable<TData>
  screenWidth: number
  tableWidth: number
  itemCount: number
}) => {
  const hasRows = itemCount > 0
  const pageState = table.getState().pagination
  const currentPage = hasRows ? pageState.pageIndex + 1 : 0
  const totalPages = hasRows ? table.getPageCount() : 0

  return (
    <View
      bottom="$3"
      flexDirection="column-reverse"
      alignItems="center"
      $group-window-gtXs={{
        position: 'relative',
        flexDirection: 'row',
        maxWidth: tableWidth,
        justifyContent: 'space-between',
      }}
      $platform-native={{
        gap: '$6',
        width: '100%',
        paddingHorizontal: '$4',
      }}
      paddingTop="$4"
      gap="$4"
    >
      <XGroup
        bordered
        borderRadius="$10"
        width="100%"
        justifyContent="center"
        $platform-native={{
          width: '100%',
        }}
      >
        <XGroup.Item>
          <Button
            $platform-native={{ minWidth: screenWidth / 4 }}
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
            $platform-native={{ minWidth: screenWidth / 4 }}
            onPress={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <Button.Icon>
              <ChevronLeft />
            </Button.Icon>
          </Button>
        </XGroup.Item>
        <XGroup.Item>
          <Button
            $platform-native={{ minWidth: screenWidth / 4 }}
            onPress={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <Button.Icon>
              <ChevronRight />
            </Button.Icon>
          </Button>
        </XGroup.Item>
        <XGroup.Item>
          <Button
            $platform-native={{ minWidth: screenWidth / 4 }}
            onPress={() => table.setPageIndex(Math.max(table.getPageCount() - 1, 0))}
            disabled={!table.getCanNextPage()}
          >
            <Button.Icon>
              <ChevronLast />
            </Button.Icon>
          </Button>
        </XGroup.Item>
      </XGroup>
      <View
        flexDirection="row"
        borderRadius={1_000_000_000}
        padding="$2"
        paddingHorizontal="$6"
        themeInverse
        backgroundColor="$background"
        gap="$3"
        $platform-native={{ display: 'none' }}
      >
        <Text fontWeight="$5" lineHeight="$5" fontSize="$5">
          Page
        </Text>
        <Text fontWeight="$5" lineHeight="$5" fontSize="$5">
          {currentPage} of {totalPages}
        </Text>
      </View>
      <View
        $platform-native={{ display: 'none' }}
        flexDirection="row"
        gap="$4"
        alignItems="center"
        className="flex items-center gap-1"
      >
        <Text fontSize="$5" fontWeight="$5" lineHeight="$5">
          Go to page
        </Text>
        <Input
          keyboardType="numeric"
          {...(isWeb && {
            type: 'number',
          })}
          defaultValue={hasRows ? String(currentPage) : ''}
          onChangeText={(text) => {
            if (!hasRows) return
            const nextPage = text ? Number(text) - 1 : 0
            if (Number.isNaN(nextPage)) return
            table.setPageIndex(Math.min(Math.max(nextPage, 0), table.getPageCount() - 1))
          }}
          padding={0}
          ta="center"
          maxWidth={45}
          minWidth={45}
          className="border p-1 rounded"
          disabled={!hasRows}
        />
      </View>
    </View>
  )
}

export const DataTable = <TData extends Record<string, any>>({
  data,
  columns,
  pageSize = 10,
  defaultSort,
  searchPlaceholder = 'Search',
  searchableColumns,
  renderToolbar,
  renderEmptyState,
}: DataTableProps<TData>) => {
  const normalizedColumns = useMemo(() => {
    return columns.map((column, index) => {
      const id = resolveColumnId(column, index)
      const accessor = resolveAccessor(column)
      const enableSorting = column.sortable !== undefined ? column.sortable : column.key !== undefined

      return {
        ...column,
        id,
        accessor,
        enableSorting,
      }
    })
  }, [columns])

  const [searchValue, setSearchValue] = useState('')
  const [sorting, setSorting] = useState<SortingState>(
    defaultSort ? [{ id: defaultSort.key, desc: defaultSort.desc ?? false }] : [],
  )
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize })

  useEffect(() => {
    setPagination((previous) => ({ ...previous, pageSize }))
  }, [pageSize])

  const searchTargets = useMemo(() => {
    if (!searchableColumns || searchableColumns.length === 0) {
      return normalizedColumns.filter((column) => column.searchable !== false)
    }

    const normalized = searchableColumns.map((value) => value.toLowerCase())
    return normalizedColumns.filter((column) => {
      if (column.searchable === false) return false
      if (normalized.includes(column.id.toLowerCase())) return true
      if (column.key && normalized.includes(String(column.key).toLowerCase())) return true
      return false
    })
  }, [normalizedColumns, searchableColumns])

  const filteredData = useMemo(() => {
    if (!searchValue.trim()) return data
    const query = searchValue.toLowerCase()

    return data.filter((row) => {
      return searchTargets.some((column) => {
        const raw = column.filterValue ? column.filterValue(row) : column.accessor(row)

        if (Array.isArray(raw)) {
          return raw.some((value) => String(value ?? '').toLowerCase().includes(query))
        }

        if (raw === null || raw === undefined) {
          return false
        }

        return String(raw).toLowerCase().includes(query)
      })
    })
  }, [data, searchTargets, searchValue])

  useEffect(() => {
    setPagination((previous) => {
      const pageCount = Math.max(Math.ceil(filteredData.length / previous.pageSize), 1)
      if (previous.pageIndex < pageCount) {
        return previous
      }

      return { ...previous, pageIndex: Math.max(pageCount - 1, 0) }
    })
  }, [filteredData.length])

  const columnDefs = useMemo<ColumnDef<TData, unknown>[]>(
    () =>
      normalizedColumns.map((column) => ({
        id: column.id,
        accessorFn: column.accessor,
        header: column.header ?? formatHeader(column.id),
        cell: (info) => column.renderCell?.(info.getValue(), info.row.original) ?? info.getValue(),
        enableSorting: column.enableSorting,
        sortingFn: 'alphanumeric',
        meta: {
          width: column.width,
          align: column.align,
          wrapWithText: column.renderCell === undefined,
        } satisfies DataTableColumnMeta,
      })),
    [normalizedColumns],
  )

  const table = useReactTable({
    data: filteredData,
    columns: columnDefs,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: false,
    autoResetPageIndex: false,
  })

  const headerGroups = table.getHeaderGroups()
  const tableRows = table.getRowModel().rows

  const rowCounter = useRef(-1)
  rowCounter.current = -1

  const columnWidths = normalizedColumns.map((column) => resolveColumnWidth(column.width))
  const fallbackWidth = normalizedColumns.length * resolveColumnWidth()
  const tableWidth = columnWidths.reduce((total, width) => total + width, 0) || fallbackWidth

  const { width: windowWidth } = useWindowDimensions()
  const screenWidth = windowWidth - 15
  const { sm } = isWeb ? useMedia() : { sm: true }

  const searchInput = (
    <Input
      flex={1}
      size="$3"
      value={searchValue}
      onChangeText={setSearchValue}
      placeholder={searchPlaceholder}
      width="100%"
      {...(isWeb && { type: 'search' })}
    >
      <Input.Icon>
        <Search size={16} color="$gray10" />
      </Input.Icon>
    </Input>
  )

  const toolbarContent = renderToolbar?.({
    searchValue,
    setSearchValue,
    searchInput,
    totalItems: data.length,
    visibleItems: filteredData.length,
  }) ?? (
    <XStack
      width="100%"
      alignItems="center"
      justifyContent="space-between"
      gap="$3"
      flexWrap="wrap"
    >
      <XStack flex={1} minWidth={220} maxWidth="100%">
        {searchInput}
      </XStack>
      <Text color="$gray11" fontSize="$3">
        Showing {filteredData.length} of {data.length} results
      </Text>
    </XStack>
  )

  const emptyState = renderEmptyState?.({
    totalItems: data.length,
    visibleItems: filteredData.length,
  }) ?? (
    <YStack alignItems="center" gap="$2" padding="$6">
      <Text fontWeight="$6" fontSize="$5">
        No results found
      </Text>
      <Text color="$gray11" fontSize="$3">
        Try updating your search or filters.
      </Text>
    </YStack>
  )

  return (
    <FooterContainer
      Footer={() => (
        <DataTablePagination
          table={table}
          screenWidth={screenWidth}
          tableWidth={tableWidth}
          itemCount={filteredData.length}
        />
      )}
    >
      <ScrollView horizontal maxWidth="100%">
        <YStack
          flex={1}
          gap="$5"
          paddingHorizontal="$4"
          paddingVertical="$6"
          minWidth={tableWidth}
        >
          {toolbarContent}
          <Table
            alignCells={{ x: 'center', y: 'center' }}
            alignHeaderCells={{ y: 'center', x: 'center' }}
            cellWidth={DEFAULT_CELL_WIDTH}
            cellHeight="$5"
            borderWidth={0.5}
            maxWidth={tableWidth}
            borderTopRightRadius="$4"
            borderTopLeftRadius="$4"
            borderBottomLeftRadius="$2"
            borderBottomRightRadius="$2"
            mb="$10"
            $group-window-gtXs={{
              mb: 'inherit',
            }}
          >
            <Table.Head position="absolute" zIndex="$1" maxWidth={tableWidth}>
              {headerGroups.map((headerGroup) => {
                rowCounter.current++
                return (
                  <Table.Row
                    backgrounded
                    backgroundColor="$color2"
                    rowLocation={
                      rowCounter.current === 0
                        ? 'first'
                        : rowCounter.current === headerGroups.length + tableRows.length - 1
                          ? 'last'
                          : 'middle'
                    }
                    key={headerGroup.id}
                    borderTopRightRadius="$4"
                    borderTopLeftRadius="$4"
                    borderBottomLeftRadius="$0"
                    borderBottomRightRadius="$0"
                  >
                    {headerGroup.headers.map((header, index) => {
                      const columnMeta = header.column.columnDef.meta as DataTableColumnMeta | undefined
                      const justifyContent = columnMeta?.align
                        ? alignToJustify[columnMeta.align]
                        : 'flex-start'
                      const isFirst = index === 0
                      const isLast = index === headerGroup.headers.length - 1
                      const canSort = header.column.getCanSort()
                      const sortedState = header.column.getIsSorted()

                      return (
                        <Table.HeaderCell
                          cellLocation={isFirst ? 'first' : isLast ? 'last' : 'middle'}
                          key={header.id}
                          justifyContent={justifyContent}
                          {...(columnMeta?.width
                            ? typeof columnMeta.width === 'number'
                              ? { width: columnMeta.width, minWidth: columnMeta.width }
                              : { width: columnMeta.width }
                            : {})}
                        >
                          <XStack
                            flexDirection="row"
                            alignItems="center"
                            gap="$2"
                            cursor={canSort ? 'pointer' : 'default'}
                            onPress={canSort ? header.column.getToggleSortingHandler() : undefined}
                          >
                            <Text fontSize="$4" selectable={false} textAlign="left">
                              {header.isPlaceholder
                                ? null
                                : flexRender(header.column.columnDef.header, header.getContext())}
                            </Text>
                            {canSort
                              ? {
                                  asc: <ChevronUp size="$1" color="$gray10" />,
                                  desc: <ChevronDown size="$1" color="$gray10" />,
                                  false: <ChevronsUpDown size="$1" color="$gray10" />,
                                }[sortedState || 'false']
                              : null}
                          </XStack>
                        </Table.HeaderCell>
                      )
                    })}
                  </Table.Row>
                )
              })}
            </Table.Head>
            <Table.Body mt="$8">
              {tableRows.map((row, rowIndex) => {
                rowCounter.current++
                return (
                  <Table.Row
                    minWidth={tableWidth}
                    hoverStyle={{
                      backgroundColor: '$color2',
                    }}
                    rowLocation={
                      rowCounter.current === 0
                        ? 'first'
                        : rowCounter.current === headerGroups.length + tableRows.length - 1
                          ? 'last'
                          : 'middle'
                    }
                    key={`${row.id}-${rowIndex}`}
                  >
                    {row.getVisibleCells().map((cell, cellIndex) => {
                      const columnMeta = cell.column.columnDef.meta as DataTableColumnMeta | undefined
                      const justifyContent = columnMeta?.align
                        ? alignToJustify[columnMeta.align]
                        : 'flex-start'
                      const isFirst = cellIndex === 0
                      const isLast = cellIndex === row.getVisibleCells().length - 1
                      const cellContent = flexRender(cell.column.columnDef.cell, cell.getContext())
                      const shouldWrapWithText = columnMeta?.wrapWithText ?? false
                      const isPrimitive =
                        typeof cellContent === 'string' || typeof cellContent === 'number'

                      return (
                        <Table.Cell
                          cellLocation={isFirst ? 'first' : isLast ? 'last' : 'middle'}
                          key={cell.id}
                          justifyContent={justifyContent}
                          {...(columnMeta?.width
                            ? typeof columnMeta.width === 'number'
                              ? { width: columnMeta.width, minWidth: columnMeta.width }
                              : { width: columnMeta.width }
                            : {})}
                        >
                          {shouldWrapWithText && isPrimitive ? (
                            <Text fontSize="$4" color="$gray11">
                              {cellContent as string | number}
                            </Text>
                          ) : (
                            cellContent as ReactNode
                          )}
                        </Table.Cell>
                      )
                    })}
                  </Table.Row>
                )
              })}
            </Table.Body>
          </Table>
          {tableRows.length === 0 ? emptyState : null}
          {!sm ? (
            <DataTablePagination
              table={table}
              screenWidth={screenWidth}
              tableWidth={tableWidth}
              itemCount={filteredData.length}
            />
          ) : null}
        </YStack>
      </ScrollView>
    </FooterContainer>
  )
}

DataTable.fileName = 'DataTable'

