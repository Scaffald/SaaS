/**
 * Adapter to convert TanStack React Table ColumnDef to @scaffald/ui TableColumn
 * Keeps scf-core minimal by centralizing the conversion logic
 */

import type { ColumnDef } from '@tanstack/react-table'
import { flexRender } from '@tanstack/react-table'
import { createElement, isValidElement } from 'react'
import { Text } from 'react-native'
import type { TableColumn, TableRowData } from '@scaffald/ui'

/**
 * @scaffald/ui's Table drops `render()` output straight into a <View>. On web
 * a bare string is fine there; on native it is the "Text strings must be
 * rendered within a <Text> component" render error — which is what every
 * Office table did on iPad, because flexRender returns the raw value for any
 * column without a custom cell (and for custom cells that return a string).
 * Primitives get a <Text>; elements pass through untouched.
 */
function asRenderable(result: unknown) {
  if (result === null || result === undefined || result === false) return null
  if (isValidElement(result)) return result
  if (typeof result === 'string' || typeof result === 'number') {
    return createElement(Text, null, String(result))
  }
  return result as never
}

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
          return asRenderable(value !== null && value !== undefined ? String(value) : '')
        }
        const cellContext = {
          getValue: () => value,
          row: { original: row, index: rowIndex },
          column: { columnDef: def },
          getContext: () => cellContext,
        }
        return asRenderable(flexRender(def.cell, cellContext as never))
      },
    }
  })
}
