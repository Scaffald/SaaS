/**
 * DataTable - A wrapper component providing a data table with sorting and pagination
 * Built on top of @tanstack/react-table and Tamagui primitives
 */
import { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { YStack, XStack, Text, Button, styled } from '@unicornlove/ui';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

export interface DataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  enableSorting?: boolean;
  enablePagination?: boolean;
  pageSize?: number;
}

const TableContainer = styled(YStack, {
  name: 'TableContainer',
  borderWidth: 1,
  borderColor: '$borderColor',
  borderRadius: '$4',
  overflow: 'hidden',
});

const TableElement = styled(YStack, {
  name: 'TableElement',
  tag: 'table',
  width: '100%',
});

const TableHead = styled(XStack, {
  name: 'TableHead',
  tag: 'thead',
  backgroundColor: '$backgroundSecondary',
  borderBottomWidth: 1,
  borderBottomColor: '$borderColor',
});

const TableBody = styled(YStack, {
  name: 'TableBody',
  tag: 'tbody',
});

const TableRow = styled(XStack, {
  name: 'TableRow',
  tag: 'tr',
  borderBottomWidth: 1,
  borderBottomColor: '$borderColor',
  hoverStyle: {
    backgroundColor: '$backgroundHover',
  },
});

const TableHeaderCell = styled(XStack, {
  name: 'TableHeaderCell',
  tag: 'th',
  flex: 1,
  padding: '$3',
  alignItems: 'center',
  gap: '$2',
  cursor: 'pointer',
  userSelect: 'none',
});

const TableCell = styled(XStack, {
  name: 'TableCell',
  tag: 'td',
  flex: 1,
  padding: '$3',
  alignItems: 'center',
});

const PaginationContainer = styled(XStack, {
  name: 'PaginationContainer',
  padding: '$3',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderTopWidth: 1,
  borderTopColor: '$borderColor',
  backgroundColor: '$backgroundSecondary',
});

export function DataTable<TData>({
  data,
  columns,
  enableSorting = false,
  enablePagination = false,
  pageSize = 10,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,
    initialState: {
      pagination: {
        pageSize,
      },
    },
  });

  const currentPage = table.getState().pagination.pageIndex + 1;
  const totalPages = table.getPageCount();

  return (
    <TableContainer>
      <TableElement>
        <TableHead>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const canSort = enableSorting && header.column.getCanSort();
                const sortDirection = header.column.getIsSorted();

                return (
                  <TableHeaderCell
                    key={header.id}
                    onPress={canSort ? header.column.getToggleSortingHandler() : undefined}
                    style={{ cursor: canSort ? 'pointer' : 'default' }}
                  >
                    <Text fontWeight="600" fontSize="$3">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </Text>
                    {canSort && sortDirection && (
                      sortDirection === 'asc' ? (
                        <ChevronUp size={14} />
                      ) : (
                        <ChevronDown size={14} />
                      )
                    )}
                  </TableHeaderCell>
                );
              })}
            </TableRow>
          ))}
        </TableHead>

        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </TableElement>

      {enablePagination && totalPages > 1 && (
        <PaginationContainer>
          <Text fontSize="$2" color="$color10">
            Page {currentPage} of {totalPages}
          </Text>
          <XStack gap="$2">
            <Button
              size="$2"
              onPress={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              opacity={!table.getCanPreviousPage() ? 0.5 : 1}
            >
              <ChevronLeft size={16} />
            </Button>
            <Button
              size="$2"
              onPress={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              opacity={!table.getCanNextPage() ? 0.5 : 1}
            >
              <ChevronRight size={16} />
            </Button>
          </XStack>
        </PaginationContainer>
      )}
    </TableContainer>
  );
}

export default DataTable;
