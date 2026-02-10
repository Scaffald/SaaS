import { Trophy } from 'lucide-react-native'
import { memo } from 'react'
import { Text, Row, Stack } from '@unicornlove/beyond-ui'
import type { CompletionMilestone } from '../hooks/useCompletionStatus'

interface MilestoneBadgeProps {
  milestone: CompletionMilestone
}

export const MilestoneBadge = memo(function MilestoneBadge({ milestone }: MilestoneBadgeProps) {
  return (
    <Row
      gap="$2"
      alignItems="center"
      paddingHorizontal="$3"
      paddingVertical="$2"
      backgroundColor={milestone.achieved ? '$green3' : '$color3'}
      borderColor={milestone.achieved ? '$green7' : '$color5'}
      borderWidth={1}
      borderRadius="$3"
      opacity={milestone.achieved ? 1 : 0.7}
    >
      <Trophy
        size={16}
        color={milestone.achieved ? '$green10' : '$color10'}
        data-testid="trophy-icon"
      />
      <Stack>
        <Text fontSize="$2" fontWeight="600" color={milestone.achieved ? '$green11' : '$color11'}>
          {milestone.label}
        </Text>
        <Text fontSize="$1" color="$color10">
          {milestone.threshold}% milestone
        </Text>
      </Stack>
    </Row>
  )
})
