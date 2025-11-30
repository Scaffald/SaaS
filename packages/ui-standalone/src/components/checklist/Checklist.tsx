import { Spinner, Text, YStack } from 'tamagui'
import { ChecklistHeader } from './ChecklistHeader'
import { ChecklistList } from './ChecklistList'
import { ChecklistProgress } from './ChecklistProgress'
import type { ChecklistProps } from './types'

/**
 * Checklist - Generic checklist component for tracking completion
 *
 * Features:
 * - Progress bar showing completion percentage
 * - Clean list of clickable items
 * - Status indicators (checkmarks for complete items)
 * - Navigation arrows for incomplete items
 * - Responsive design for all platforms
 *
 * @param props - Component props
 * @returns JSX element
 */
export const Checklist = ({
  title,
  subtitle,
  items,
  completionPercentage,
  onItemPress,
  isLoading = false,
  showProgress = true,
}: ChecklistProps) => {
  if (isLoading) {
    return (
      <YStack gap="$4" p="$4" flex={1} justify="center" items="center">
        <Spinner size="large" />
        <Text color="$color10">Loading...</Text>
      </YStack>
    )
  }

  return (
    <YStack gap="$4" p="$4">
      {(title || subtitle) && <ChecklistHeader title={title} subtitle={subtitle} />}
      {showProgress && <ChecklistProgress completionPercentage={completionPercentage} />}
      <ChecklistList items={items} onItemPress={onItemPress} />
    </YStack>
  )
}
