import type { ChecklistProgressProps } from './types'
import { Progress } from '@tamagui/progress'
import { Text } from 'tamagui'
import { XStack, YStack } from '@tamagui/stacks'

/**
 * ChecklistProgress - Progress bar showing completion percentage
 *
 * @param completionPercentage - Completion percentage (0-100)
 * @returns JSX element
 */
export const ChecklistProgress = ({ completionPercentage }: ChecklistProgressProps) => {
  return (
    <YStack gap="$2">
      <XStack style={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Text fontSize="$5" fontWeight="600" color="$color12">
          {Math.round(completionPercentage)}% Complete
        </Text>
      </XStack>
      <Progress
        value={completionPercentage}
        max={100}
        background="$color4"
        style={{ borderRadius: 8 }}
        height={8}
      >
        <Progress.Indicator background="$green9" style={{ borderRadius: 8 }} animation="bouncy" />
      </Progress>
    </YStack>
  )
}
