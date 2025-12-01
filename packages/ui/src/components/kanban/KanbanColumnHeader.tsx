import { MoreVertical, Plus } from '@tamagui/lucide-icons'
import { memo } from 'react'
import type { GetThemeValueForKey } from 'tamagui'
import { Text, XStack, YStack } from 'tamagui'
import { Button } from '../buttons/Button'

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
      <XStack justifyContent="space-between" alignItems="center" marginBottom="$3">
        <XStack gap="$2" alignItems="center" flex={1}>
          {/* Status color indicator */}
          <YStack width={8} height={8} borderRadius="$10" backgroundColor={color} />

          {/* Title */}
          <Text fontWeight="600" fontSize="$4" flex={1}>
            {title}
          </Text>

          {/* Count badge */}
          <YStack
            backgroundColor="$color5"
            paddingHorizontal="$2"
            paddingVertical="$1"
            borderRadius="$2"
          >
            <Text fontSize="$2" fontWeight="600" color="$color11">
              {count}
            </Text>
          </YStack>
        </XStack>

        {/* Action buttons */}
        <XStack gap="$1" alignItems="center">
          {onAdd && (
            <Button
              size="$2"
              circular
              unstyled
              onPress={onAdd}
              backgroundColor="$color5"
              alignItems="center"
              justifyContent="center"
              width={24}
              height={24}
              hoverStyle={{ backgroundColor: '$color6' }}
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
              backgroundColor="$color5"
              alignItems="center"
              justifyContent="center"
              width={24}
              height={24}
              hoverStyle={{ backgroundColor: '$color6' }}
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
