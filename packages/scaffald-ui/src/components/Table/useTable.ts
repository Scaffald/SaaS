import { useState, useMemo, useCallback } from 'react'
import type { TableColumn, TableSortConfig, TableSelectionConfig, TableExpansionConfig, TableRowData } from './Table.types'
import type { SortDirection } from './TableColumnHeader.types'

export interface UseTableProps {
  columns: TableColumn[]
  data: TableRowData[]
  searchValue?: string
  onSearchChange?: (value: string) => void
  sortConfig?: TableSortConfig
  onSort?: (columnId: string, direction: SortDirection) => void
  selectionConfig?: TableSelectionConfig
  onRowSelect?: (rowIds: string[]) => void
  expansionConfig?: TableExpansionConfig
  onRowExpand?: (rowId: string, expanded: boolean) => void
  pageSize?: number
  pagination?: {
    currentPage?: number
    onPageChange?: (page: number) => void
  }
  columnVisibility?: Record<string, boolean>
}

export function useTable({
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
}: UseTableProps) {
  // Internal states
  const [internalSearchValue, setInternalSearchValue] = useState('')
  const [internalSortConfig, setInternalSortConfig] = useState<TableSortConfig>({
    columnId: null,
    direction: null,
  })
  const [internalSelectionConfig, setInternalSelectionConfig] = useState<TableSelectionConfig>({
    selectedIds: new Set<string>(),
    mode: 'multiple',
    allSelected: false,
    indeterminate: false,
  })
  const [internalExpansionConfig, setInternalExpansionConfig] = useState<TableExpansionConfig>({
    expandedIds: new Set<string>(),
    allowMultiple: false,
  })
  const [internalPage, setInternalPage] = useState(1)

  // Resolved values
  const searchValue = controlledSearchValue !== undefined ? controlledSearchValue : internalSearchValue
  const sortConfig = controlledSortConfig || internalSortConfig
  const selectionConfig = controlledSelectionConfig || internalSelectionConfig
  const expansionConfig = controlledExpansionConfig || internalExpansionConfig
  const currentPage = pagination?.currentPage ?? internalPage

  // Filter columns
  const visibleColumns = useMemo(() => {
    if (!columnVisibility) return columns
    return columns.filter((col) => columnVisibility[col.id] !== false)
  }, [columns, columnVisibility])

  // Logic: Search
  const filteredData = useMemo(() => {
    if (!searchValue.trim()) return data
    const searchLower = searchValue.toLowerCase()
    return data.filter((row) => {
      return visibleColumns.some((col) => {
        const value = row[col.id]
        if (value === null || value === undefined) return false
        return String(value).toLowerCase().includes(searchLower)
      })
    })
  }, [data, visibleColumns, searchValue])

  // Logic: Sort
  const sortedData = useMemo(() => {
    if (!sortConfig.columnId || !sortConfig.direction) return filteredData
    const column = visibleColumns.find((col) => col.id === sortConfig.columnId)
    if (!column) return filteredData

    return [...filteredData].sort((a, b) => {
      const aValue = a[column.id]
      const bValue = b[column.id]
      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
      }
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue
      }
      return sortConfig.direction === 'asc' ? String(aValue).localeCompare(String(bValue)) : String(bValue).localeCompare(String(aValue))
    })
  }, [filteredData, sortConfig, visibleColumns])

  // Logic: Pagination
  const totalPages = useMemo(() => {
    if (!pageSize || pageSize <= 0) return 1
    return Math.max(1, Math.ceil(sortedData.length / pageSize))
  }, [sortedData.length, pageSize])

  const displayData = useMemo(() => {
    if (!pageSize || pageSize <= 0) return sortedData
    const start = (currentPage - 1) * pageSize
    return sortedData.slice(start, start + pageSize)
  }, [sortedData, pageSize, currentPage])

  // Actions
  const handleSearchChange = useCallback((value: string) => {
    if (controlledSearchValue === undefined) setInternalSearchValue(value)
    onSearchChange?.(value)
  }, [controlledSearchValue, onSearchChange])

  const handleSort = useCallback((columnId: string, direction: SortDirection) => {
    if (!controlledSortConfig) setInternalSortConfig({ columnId, direction })
    onSort?.(columnId, direction)
  }, [controlledSortConfig, onSort])

  const handleRowSelect = useCallback((rowId: string, selected: boolean) => {
    const newSelectedIds = new Set(selectionConfig.selectedIds)
    if (selected) {
      if (selectionConfig.mode === 'single') newSelectedIds.clear()
      newSelectedIds.add(rowId)
    } else {
      newSelectedIds.delete(rowId)
    }

    if (!controlledSelectionConfig) {
      setInternalSelectionConfig({
        ...selectionConfig,
        selectedIds: newSelectedIds,
        allSelected: newSelectedIds.size === data.length && data.length > 0,
        indeterminate: newSelectedIds.size > 0 && newSelectedIds.size < data.length,
      })
    }
    onRowSelect?.(Array.from(newSelectedIds))
  }, [selectionConfig, data.length, controlledSelectionConfig, onRowSelect])

  const handleSelectAll = useCallback((selected: boolean) => {
    const newSelectedIds = selected ? new Set(data.map((row) => row.id || String(row))) : new Set<string>()
    if (!controlledSelectionConfig) {
      setInternalSelectionConfig({
        ...selectionConfig,
        selectedIds: newSelectedIds,
        allSelected: selected,
        indeterminate: false,
      })
    }
    onRowSelect?.(Array.from(newSelectedIds))
  }, [data, selectionConfig, controlledSelectionConfig, onRowSelect])

  const handleRowExpand = useCallback((rowId: string, expanded: boolean) => {
    const newExpandedIds = new Set(expansionConfig.expandedIds)
    if (expanded) {
      if (!expansionConfig.allowMultiple) newExpandedIds.clear()
      newExpandedIds.add(rowId)
    } else {
      newExpandedIds.delete(rowId)
    }

    if (!controlledExpansionConfig) {
      setInternalExpansionConfig({ ...expansionConfig, expandedIds: newExpandedIds })
    }
    onRowExpand?.(rowId, expanded)
  }, [expansionConfig, controlledExpansionConfig, onRowExpand])

  const handlePageChange = useCallback((page: number) => {
    if (pagination?.currentPage === undefined) setInternalPage(page)
    pagination?.onPageChange?.(page)
  }, [pagination])

  return {
    // State
    visibleColumns,
    displayData,
    searchValue,
    sortConfig,
    selectionConfig,
    expansionConfig,
    currentPage,
    totalPages,
    
    // Actions
    handleSearchChange,
    handleSort,
    handleRowSelect,
    handleSelectAll,
    handleRowExpand,
    handlePageChange,
  }
}
