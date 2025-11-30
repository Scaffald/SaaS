import { MoreVertical, Plus } from '@tamagui/lucide-icons'
import { memo } from 'react'
import type { GetThemeValueForKey } from 'tamagui'
import { Button, Text, XStack, YStack } from 'tamagui'

export interface KanbanColumnHeaderProps {
  /** Column title */
  title: string
  /** Number of items in the column */
  count: number
  /** Status color for the indicator */
  color: GetThemeValueForKey<'backgroundColor'>
  /** Optional callback when add button is clicked */
  onAdd?: () => void
  /** Optional callback when menu button is clicked */
  onMenuClick?: () => void
}

/**
 * KanbanColumnHeader - Header component for Kanban columns
 *
 * Displays column title, count badge, and action buttons (add, menu).
 * Includes a status color indicator dot.
 *
 * @example
 * ```tsx
 * <KanbanColumnHeader
 *   title="Screening"
 *   count={5}
 *   color="$yellow9"
 *   onAdd={() => console.log('Add')}
 *   onMenuClick={() => console.log('Menu')}
 * />
 * ```
 */
export const KanbanColumnHeader = memo(
  ({ title, count, color, onAdd, onMenuClick }: KanbanColumnHeaderProps) => {
    return (
      <XStack justify="space-between" items="center" mb="$3">
        <XStack gap="$2" items="center" flex={1}>
          {/* Status color indicator */}
          <YStack width={8} height={8} rounded="$10" bg={color} />

          {/* Title */}
          <Text fontWeight="600" fontSize="$4" flex={1}>
            {title}
          </Text>

          {/* Count badge */}
          <YStack bg="$color5" px="$2" py="$1" rounded="$2">
            <Text fontSize="$2" fontWeight="600" color="$color11">
              {count}
            </Text>
          </YStack>
        </XStack>

        {/* Action buttons */}
        <XStack gap="$1" items="center">
          {onAdd && (
            <Button
              size="$2"
              circular
              unstyled
              onPress={onAdd}
              bg="$color5"
              items="center"
              justify="center"
              width={24}
              height={24}
              hoverStyle={{ bg: '$color6' }}
            >
              <Plus size={14} color="$color11" />
            </Button>
          )}
          {onMenuClick && (
            <Button
              size="$2"
              circular
              unstyled
              onPress={onMenuClick}
              bg="$color5"
              items="center"
              justify="center"
              width={24}
              height={24}
              hoverStyle={{ bg: '$color6' }}
            >
              <MoreVertical size={14} color="$color11" />
            </Button>
          )}
        </XStack>
      </XStack>
    )
  }
)

KanbanColumnHeader.displayName = 'KanbanColumnHeader'
