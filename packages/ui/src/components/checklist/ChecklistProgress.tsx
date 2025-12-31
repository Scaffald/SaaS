import { Progress, Text, XStack, YStack } from '@unicornlove/ui'
import type { ChecklistProgressProps } from './types'

/**
 * ChecklistProgress - Progress bar showing completion percentage
 *
 * @param completionPercentage - Completion percentage (0-100)
 * @returns JSX element
 */
export const ChecklistProgress = ({ completionPercentage }: ChecklistProgressProps) => {
  return (
    <YStack gap="$2">
      <XStack alignItems="center" justifyContent="space-between">
        <Text fontSize="$5" fontWeight="600" color="$color12">
          {Math.round(completionPercentage)}% Complete
        </Text>
      </XStack>
      <Progress
        value={completionPercentage}
        max={100}
        backgroundColor="$color4"
        borderRadius="$2"
        height={8}
      >
        <Progress.Indicator backgroundColor="$green9" borderRadius="$2" animation="bouncy" />
      </Progress>
    </YStack>
  )
}
