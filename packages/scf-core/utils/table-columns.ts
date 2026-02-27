/**
 * Adapter to convert TanStack React Table ColumnDef to @scaffald/ui TableColumn
 * Keeps scf-core minimal by centralizing the conversion logic
 */

import type { ColumnDef } from '@tanstack/react-table'
import { flexRender } from '@tanstack/react-table'
import type { TableColumn, TableRowData } from '@scaffald/ui'

/**
 * Convert TanStack ColumnDef array to @scaffald/ui TableColumn array
 * Uses flexRender to support React components in header/cell
 */
export function columnsFromTanStack<TData extends Record<string, unknown>>(
  defs: ColumnDef<TData, unknown>[]
): TableColumn[] {
  return defs.map((def) => {
    const id = (def as { id?: string }).id ?? (def as { accessorKey?: string }).accessorKey ?? 'unknown'
    const accessorKey = (def as { accessorKey?: string }).accessorKey
    const meta = def.meta as { width?: number | string } | undefined

    return {
      id,
      title: typeof def.header === 'string' ? def.header : (accessorKey ?? id),
      width: meta?.width,
      sortable: (def as { enableSorting?: boolean }).enableSorting !== false,
      render: (value: unknown, row: TableRowData, rowIndex: number) => {
        if (!def.cell) {
          return value !== null && value !== undefined ? String(value) : ''
        }
        const cellContext = {
          getValue: () => value,
          row: { original: row, index: rowIndex },
          column: { columnDef: def },
          getContext: () => cellContext,
        }
        return flexRender(def.cell, cellContext as never)
      },
    }
  })
}
