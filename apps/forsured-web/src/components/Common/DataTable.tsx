/**
 * DataTable - A wrapper component providing a data table with sorting and pagination
 * Built on top of Beyond UI Table component
 * Migrated from @tanstack/react-table to Beyond UI Table
 */
import React, { useState, useMemo } from 'react';
import {
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { Table, type TableColumn } from '@scaffald/ui';
import type { TableRowData } from '@scaffald/ui';

export interface DataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  enableSorting?: boolean;
  enablePagination?: boolean;
  pageSize?: number;
}

/**
 * Convert @tanstack/react-table ColumnDef to Beyond UI TableColumn
 */
function convertColumns<TData>(
  columns: ColumnDef<TData, unknown>[],
  enableSorting: boolean
): TableColumn[] {
  return columns.map((col) => {
    const header = typeof col.header === 'function' ? col.header({} as any) : col.header;
    const headerText = typeof header === 'string' ? header : String(header);

    return {
      id: String(col.id || col.accessorKey || Math.random()),
      title: headerText,
      sortable: enableSorting && (col.enableSorting !== false),
      width: col.size ? Number(col.size) : undefined,
      align: col.meta?.align || 'left',
      cellType: col.meta?.cellType,
      render: col.cell
        ? (value: unknown, row: TableRowData) => {
            // Create a mock context for flexRender compatibility
            const mockContext = {
              getValue: () => value,
              row: { original: row },
              column: { id: col.id || '' },
            } as any;
            const cellContent = typeof col.cell === 'function'
              ? col.cell(mockContext)
              : col.cell;
            return cellContent as React.ReactNode;
          }
        : undefined,
    };
  });
}

/**
 * Convert sorting state from @tanstack/react-table to Beyond UI format
 */
function convertSorting(sorting: SortingState): { columnId: string | null; direction: 'asc' | 'desc' | null } {
  if (sorting.length === 0) {
    return { columnId: null, direction: null };
  }
  const firstSort = sorting[0];
  return {
    columnId: firstSort.id,
    direction: firstSort.desc ? 'desc' : 'asc',
  };
}

export function DataTable<TData extends Record<string, unknown>>({
  data,
  columns,
  enableSorting = false,
  enablePagination = false,
  pageSize = 10,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [currentPage, setCurrentPage] = useState(1);

  // Convert columns to Beyond UI format
  const tableColumns = useMemo(
    () => convertColumns(columns, enableSorting),
    [columns, enableSorting]
  );

  // Convert data to Beyond UI format (ensure each row has an id)
  const tableData = useMemo(
    () =>
      data.map((row, index) => ({
        ...row,
        id: (row as any).id || String(index),
      })),
    [data]
  );

  // Convert sorting state
  const sortConfig = useMemo(() => convertSorting(sorting), [sorting]);

  // Handle sorting
  const handleSort = (columnId: string | null, direction: 'asc' | 'desc' | null) => {
    if (!columnId || !direction) {
      setSorting([]);
      return;
    }
    setSorting([{ id: columnId, desc: direction === 'desc' }]);
  };

  // Calculate pagination
  const totalPages = enablePagination ? Math.ceil(data.length / pageSize) : 1;
  const paginatedData = enablePagination
    ? tableData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : tableData;

  return (
    <Table
      columns={tableColumns}
      data={paginatedData}
      sortConfig={enableSorting ? sortConfig : undefined}
      onSort={enableSorting ? handleSort : undefined}
      pagination={
        enablePagination && totalPages > 1
          ? {
              totalPages,
              currentPage,
              onPageChange: setCurrentPage,
            }
          : undefined
      }
    />
  );
}

export default DataTable;
