import type { UniqueIdentifier } from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { ReactNode } from 'react'
import type { KanbanCardProps } from './KanbanCard'
import { KanbanCard } from './KanbanCard'

interface DraggableCardProps {
  id: UniqueIdentifier
  children?: ReactNode
  disabled?: boolean
  /** Optional KanbanCard props - if provided, renders KanbanCard instead of children */
  kanbanCardProps?: Omit<KanbanCardProps, 'id' | 'isDragging'>
}

export const DraggableCard = ({
  id,
  children,
  disabled = false,
  kanbanCardProps,
}: DraggableCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: disabled ? 'default' : 'grab',
  }

  // If kanbanCardProps are provided, render KanbanCard with drag state
  if (kanbanCardProps) {
    return (
      <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
        <KanbanCard {...kanbanCardProps} id={id} isDragging={isDragging} />
      </div>
    )
  }

  // Backward compatibility: render children with opacity for drag state
  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        opacity: isDragging ? 0.5 : 1,
      }}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  )
}
