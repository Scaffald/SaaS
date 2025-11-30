import type { UniqueIdentifier } from '@dnd-kit/core'

export interface KanbanColumn {
  id: UniqueIdentifier
  title: string
  color: string
}

export interface KanbanItem {
  id: UniqueIdentifier
  columnId: UniqueIdentifier
}

export interface DragState {
  activeId: UniqueIdentifier | null
  overId: UniqueIdentifier | null
}
