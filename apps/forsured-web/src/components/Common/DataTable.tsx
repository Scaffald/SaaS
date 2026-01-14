/**
 * DataTable - A wrapper component providing a data table with sorting and pagination
 * Built on top of @tanstack/react-table and Beyond UI primitives
 * Migrated from Tamagui to Beyond UI
 */
import { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { Stack, Row, Text, Button } from '@unicornlove/beyond-ui';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

export interface DataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  enableSorting?: boolean;
  enablePagination?: boolean;
  pageSize?: number;
}

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
    <Stack
      style={{
        border: '1px solid var(--color-border)',
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead
          style={{
            backgroundColor: 'var(--color-background-secondary)',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const canSort = enableSorting && header.column.getCanSort();
                const sortDirection = header.column.getIsSorted();

                return (
                  <th
                    key={header.id}
                    onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                    style={{
                      padding: 12,
                      textAlign: 'left',
                      cursor: canSort ? 'pointer' : 'default',
                      userSelect: 'none',
                    }}
                  >
                    <Row alignItems="center" gap={8}>
                      <Text weight="semibold" size="sm">
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
                    </Row>
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>

        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              style={{
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  style={{
                    padding: 12,
                  }}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {enablePagination && totalPages > 1 && (
        <Row
          padding={12}
          alignItems="center"
          justifyContent="space-between"
          style={{
            borderTop: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-background-secondary)',
          }}
        >
          <Text size="sm" muted>
            Page {currentPage} of {totalPages}
          </Text>
          <Row gap={8}>
            <Button
              size="sm"
              variant="ghost"
              onPress={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              style={{ opacity: !table.getCanPreviousPage() ? 0.5 : 1 }}
            >
              <ChevronLeft size={16} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onPress={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              style={{ opacity: !table.getCanNextPage() ? 0.5 : 1 }}
            >
              <ChevronRight size={16} />
            </Button>
          </Row>
        </Row>
      )}
    </Stack>
  );
}

export default DataTable;
