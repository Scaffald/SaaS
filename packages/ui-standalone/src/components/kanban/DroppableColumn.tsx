import type { UniqueIdentifier } from '@dnd-kit/core'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { ReactNode } from 'react'
import type { GetThemeValueForKey } from 'tamagui'
import { Card, Text, YStack } from 'tamagui'
import { KanbanColumnHeader } from './KanbanColumnHeader'

interface DroppableColumnProps {
  id: UniqueIdentifier
  items: UniqueIdentifier[]
  children: ReactNode
  /** Optional column title for header */
  title?: string
  /** Optional count for header badge */
  count?: number
  /** Optional color for header indicator */
  color?: GetThemeValueForKey<'backgroundColor'>
  /** Optional callback when add button is clicked */
  onAdd?: () => void
  /** Optional callback when menu button is clicked */
  onMenuClick?: () => void
  /** Optional empty state message */
  emptyMessage?: string
}

export const DroppableColumn = ({
  id,
  items,
  children,
  title,
  count,
  color,
  onAdd,
  onMenuClick,
  emptyMessage = 'No items',
}: DroppableColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
  })

  const columnContent = (
    <SortableContext id={id.toString()} items={items} strategy={verticalListSortingStrategy}>
      <div
        ref={setNodeRef}
        style={{
          minHeight: '200px',
          backgroundColor: isOver ? 'rgba(0, 0, 0, 0.05)' : 'transparent',
          transition: 'background-color 0.2s',
        }}
      >
        {children}
      </div>
    </SortableContext>
  )

  // If header props are provided, wrap in styled column container
  if (title !== undefined) {
    return (
      <YStack
        data-testid={`kanban-column-${id}`}
        width={320}
        bg="$gray2"
        rounded="$4"
        p="$4"
        gap="$3"
        style={{ minHeight: 200 }}
      >
        {title && (
          <KanbanColumnHeader
            title={title}
            count={count ?? items.length}
            color={color ?? '$blue9'}
            onAdd={onAdd}
            onMenuClick={onMenuClick}
          />
        )}

        <YStack gap="$3" flex={1}>
          {items.length === 0 ? (
            <Card p="$4" bg="$color3" rounded="$2">
              <Text fontSize="$2" text="center" color="$color10">
                {emptyMessage}
              </Text>
            </Card>
          ) : (
            columnContent
          )}
        </YStack>
      </YStack>
    )
  }

  // Backward compatibility: return just the drop zone wrapper
  return columnContent
}
