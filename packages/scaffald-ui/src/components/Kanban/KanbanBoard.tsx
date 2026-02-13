import { ScrollView } from 'react-native'
import { Row } from '../Layout'
import { spacing } from '../../tokens/spacing'
import type { KanbanBoardProps } from './Kanban.types'

/**
 * KanbanBoard – horizontal layout of columns. No drag-and-drop in core;
 * for DnD use an optional peer (e.g. @dnd-kit) and wrap columns/cards.
 */
export function KanbanBoard({
  children,
  emptyMessage: _emptyMessage,
  style,
}: KanbanBoardProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        flexDirection: 'row',
        gap: style?.gap ?? spacing[4],
        padding: style?.padding ?? spacing[4],
        overflow: 'visible' as const,
      }}
    >
      {children}
    </ScrollView>
  )
}
