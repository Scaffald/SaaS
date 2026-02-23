import { useMemo } from 'react'
import type { KanbanColumnConfig, KanbanCardData } from './Kanban.types'

export interface UseKanbanProps {
  columns: KanbanColumnConfig[]
  items: KanbanCardData[]
}

export function useKanban({ columns, items }: UseKanbanProps) {
  const groupedItems = useMemo(() => {
    const groups: Record<string, KanbanCardData[]> = {}
    
    // Initialize groups
    columns.forEach((col) => {
      groups[col.id] = []
    })

    // Populate groups
    items.forEach((item) => {
      if (groups[item.columnId]) {
        groups[item.columnId].push(item)
      }
    })

    return groups
  }, [columns, items])

  return {
    groupedItems,
    columns,
  }
}
