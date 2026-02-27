/**
 * Kanban layout primitives (no DnD in core; optional peer @dnd-kit for drag-and-drop).
 */

import type { ReactNode } from 'react'

export interface KanbanColumnConfig {
  id: string
  title: string
  color?: string
}

export interface KanbanCardData {
  id: string
  columnId: string
  [key: string]: unknown
}

export interface KanbanBoardProps {
  /** Column definitions (for controlled layout) */
  columns?: KanbanColumnConfig[]
  /** Card items grouped by column (for controlled layout). If omitted, use children. */
  items?: KanbanCardData[]
  /** Optional empty message for columns */
  emptyMessage?: string
  /** Children: typically KanbanColumn components */
  children?: ReactNode
  /** Optional style for the board container */
  style?: { flexDirection?: 'row'; gap?: number; overflow?: string; padding?: number }
}

export interface KanbanColumnProps {
  id: string
  title: string
  color?: string
  count?: number
  onAdd?: () => void
  onMenuClick?: () => void
  emptyMessage?: string
  children?: ReactNode
}

export interface KanbanCardProps {
  id: string
  /** Whether the card is being dragged (for styling) */
  isDragging?: boolean
  children?: ReactNode
}
