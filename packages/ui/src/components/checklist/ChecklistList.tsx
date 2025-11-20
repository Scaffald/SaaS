import { YStack } from 'tamagui'
import { ChecklistItem } from './ChecklistItem'
import type { ChecklistListProps } from './types'

/**
 * ChecklistList - List container for checklist items
 *
 * @param items - Array of checklist items
 * @param onItemPress - Handler for item press events
 * @returns JSX element
 */
export const ChecklistList = ({ items, onItemPress }: ChecklistListProps) => {
  return (
    <YStack gap="$2">
      {items.map((item) => (
        <ChecklistItem key={item.id} item={item} onPress={() => onItemPress?.(item)} />
      ))}
    </YStack>
  )
}
