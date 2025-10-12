import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { ReactNode } from 'react'
import type { UniqueIdentifier } from '@dnd-kit/core'

interface DroppableColumnProps {
  id: UniqueIdentifier
  items: UniqueIdentifier[]
  children: ReactNode
}

export const DroppableColumn = ({ id, items, children }: DroppableColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
  })

  return (
    <SortableContext id={id.toString()} items={items} strategy={verticalListSortingStrategy}>
      <div
        ref={setNodeRef}
        style={{
          minHeight: '100px',
          backgroundColor: isOver ? 'rgba(0, 0, 0, 0.05)' : 'transparent',
          transition: 'background-color 0.2s',
        }}
      >
        {children}
      </div>
    </SortableContext>
  )
}
