import { ScrollView, View } from 'react-native'
import { spacing } from '../../tokens/spacing'
import type { KanbanBoardProps } from './Kanban.types'
import { useKanban } from './useKanban'
import { KanbanColumn } from './KanbanColumn'
import { KanbanCard } from './KanbanCard'

/**
 * KanbanBoard – horizontal layout of columns.
 * Supports both manual children composition and data-driven layout.
 */
export function KanbanBoard({
  columns,
  items,
  children,
  emptyMessage,
  style,
}: KanbanBoardProps) {
  const kanban = useKanban({
    columns: columns || [],
    items: items || [],
  })

  const renderContent = () => {
    if (columns && items) {
      return kanban.columns.map((column) => (
        <KanbanColumn
          key={column.id}
          id={column.id}
          title={column.title}
          color={column.color}
          count={kanban.groupedItems[column.id].length}
          emptyMessage={emptyMessage}
        >
          {kanban.groupedItems[column.id].map((item) => (
            <KanbanCard key={item.id} id={item.id}>
               {/* Note: In a real app, users would pass a renderCard prop */}
               {/* For now we just render a placeholder if no children provided in card */}
               <View style={{ padding: spacing[2] }} />
            </KanbanCard>
          ))}
        </KanbanColumn>
      ))
    }
    return children
  }

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
      {renderContent()}
    </ScrollView>
  )
}
