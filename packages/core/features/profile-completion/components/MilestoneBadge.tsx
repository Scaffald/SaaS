import { Trophy } from '@tamagui/lucide-icons'
import { memo } from 'react'
import { Text, XStack, YStack } from 'tamagui'
import type { CompletionMilestone } from '../hooks/useCompletionStatus'

interface MilestoneBadgeProps {
  milestone: CompletionMilestone
}

export const MilestoneBadge = memo(function MilestoneBadge({ milestone }: MilestoneBadgeProps) {
  return (
    <XStack
      gap="$2"
      items="center"
      px="$3"
      py="$2"
      bg={milestone.achieved ? '$green3' : '$color3'}
      borderColor={milestone.achieved ? '$green7' : '$color5'}
      borderWidth={1}
      rounded="$3"
      opacity={milestone.achieved ? 1 : 0.7}
    >
      <Trophy size={16} color={milestone.achieved ? '$green10' : '$color10'} />
      <YStack>
        <Text fontSize="$2" fontWeight="600" color={milestone.achieved ? '$green11' : '$color11'}>
          {milestone.label}
        </Text>
        <Text fontSize="$1" color="$color10">
          {milestone.threshold}% milestone
        </Text>
      </YStack>
    </XStack>
  )
})
