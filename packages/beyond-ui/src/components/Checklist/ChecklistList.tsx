import { Stack } from '../Layout'
import { ChecklistItem } from './ChecklistItem'
import { spacing } from '../../tokens/spacing'
import type { ChecklistListProps } from './Checklist.types'

export function ChecklistList({ items, onItemPress }: ChecklistListProps) {
  return (
    <Stack gap={spacing[2]}>
      {items.map((item) => (
        <ChecklistItem
          key={item.id}
          item={item}
          onPress={() => onItemPress?.(item)}
        />
      ))}
    </Stack>
  )
}
