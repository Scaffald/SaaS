import { MoreVertical, Plus } from '@tamagui/lucide-icons'
import type { GetThemeValueForKey } from '@tamagui/core'
import { Text } from 'tamagui'
import { XStack, YStack } from '@tamagui/stacks'
import { memo } from 'react'

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
      <XStack justifyContent="space-between" style={{ alignItems: 'center' }} mb="$3">
        <XStack gap="$2" style={{ alignItems: 'center' }} flex={1}>
          {/* Status color indicator */}
          <YStack width={8} height={8} br="$10" background={color} />

          {/* Title */}
          <Text fontWeight="600" fontSize="$4" flex={1}>
            {title}
          </Text>

          {/* Count badge */}
          <YStack background="$color5" px="$2" py="$1" br="$2">
            <Text fontSize="$2" fontWeight="600" color="$color11">
              {count}
            </Text>
          </YStack>
        </XStack>

        {/* Action buttons */}
        <XStack gap="$1" style={{ alignItems: 'center' }}>
          {onAdd && (
            <Button
              size="$2"
              circular
              unstyled
              onPress={onAdd}
              background="$color5"
              style={{ alignItems: 'center', justifyContent: 'center' }}
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
              background="$color5"
              style={{ alignItems: 'center', justifyContent: 'center' }}
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
