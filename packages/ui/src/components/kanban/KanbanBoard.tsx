import type { DragEndEvent, DragStartEvent, UniqueIdentifier } from '@dnd-kit/core'
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import { ScrollView } from 'react-native'
import type { GetThemeValueForKey } from 'tamagui'
import { XStack } from 'tamagui'
import { DraggableCard } from './DraggableCard'
import { DroppableColumn } from './DroppableColumn'
import type { KanbanCardProps } from './KanbanCard'

export interface KanbanColumnConfig {
  id: UniqueIdentifier
  title: string
  color: GetThemeValueForKey<'backgroundColor'>
}

export interface KanbanCardData extends Omit<KanbanCardProps, 'id' | 'isDragging'> {
  id: UniqueIdentifier
  columnId: UniqueIdentifier
}

export interface KanbanBoardProps {
  /** Column configurations */
  columns: KanbanColumnConfig[]
  /** Card data items */
  items: KanbanCardData[]
  /** Callback when drag ends */
  onDragEnd: (event: DragEndEvent) => void
  /** Optional callback when status changes (for confirmation modals, etc.) */
  onStatusChange?: (
    itemId: string,
    fromColumnId: UniqueIdentifier,
    toColumnId: UniqueIdentifier
  ) => Promise<void>
  /** Optional drag overlay render function */
  renderDragOverlay?: (activeId: UniqueIdentifier) => ReactNode
  /** Optional callback when column add button is clicked */
  onColumnAdd?: (columnId: UniqueIdentifier) => void
  /** Optional callback when column menu is clicked */
  onColumnMenu?: (columnId: UniqueIdentifier) => void
  /** Optional empty message for columns */
  emptyMessage?: string
}

/**
 * KanbanBoard - Wrapper component for Kanban boards with DndContext
 *
 * Provides drag-and-drop functionality for Kanban boards with columns and cards.
 * Handles DndContext setup, sensors, and drag overlay.
 *
 * @example
 * ```tsx
 * <KanbanBoard
 *   columns={[
 *     { id: 'new', title: 'New', color: '$blue9' },
 *     { id: 'screen', title: 'Screening', color: '$yellow9' }
 *   ]}
 *   items={[
 *     { id: '1', columnId: 'new', applicantName: 'John', ... }
 *   ]}
 *   onDragEnd={(event) => {
 *     // Handle drag end
 *   }}
 * />
 * ```
 */
export const KanbanBoard = ({
  columns,
  items,
  onDragEnd,
  onStatusChange,
  renderDragOverlay,
  onColumnAdd,
  onColumnMenu,
  emptyMessage = 'No items',
}: KanbanBoardProps) => {
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null)

  // Configure drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px of movement required to start drag
      },
    })
  )

  // Group items by column
  const itemsByColumn = useMemo(() => {
    return columns.reduce(
      (acc, column) => {
        acc[column.id] = items.filter((item) => item.columnId === column.id)
        return acc
      },
      {} as Record<UniqueIdentifier, KanbanCardData[]>
    )
  }, [columns, items])

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over || active.id === over.id) {
      onDragEnd(event)
      return
    }

    // If onStatusChange is provided, call it
    if (onStatusChange) {
      const item = items.find((i) => i.id === active.id)
      if (item) {
        try {
          await onStatusChange(item.id.toString(), item.columnId, over.id)
        } catch (error) {
          console.error('Status change failed:', error)
        }
      }
    }

    onDragEnd(event)
  }

  const handleDragCancel = () => {
    setActiveId(null)
  }

  // Find active item for drag overlay
  const activeItem = activeId ? items.find((item) => item.id === activeId) : null

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <XStack gap="$3" pb="$4">
          {columns.map((column) => {
            const columnItems = itemsByColumn[column.id] || []
            return (
              <DroppableColumn
                key={column.id}
                id={column.id}
                items={columnItems.map((item) => item.id)}
                title={column.title}
                count={columnItems.length}
                color={column.color}
                onAdd={onColumnAdd ? () => onColumnAdd(column.id) : undefined}
                onMenuClick={onColumnMenu ? () => onColumnMenu(column.id) : undefined}
                emptyMessage={emptyMessage}
              >
                {columnItems.map((item) => (
                  <DraggableCard key={item.id} id={item.id} kanbanCardProps={item} />
                ))}
              </DroppableColumn>
            )
          })}
        </XStack>
      </ScrollView>

      <DragOverlay>
        {activeId && activeItem && (
          <div>
            {renderDragOverlay ? (
              renderDragOverlay(activeId)
            ) : (
              <DraggableCard id={activeId} kanbanCardProps={activeItem} />
            )}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
