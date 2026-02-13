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
      gap={8}
      align="center"
      paddingHorizontal={12}
      paddingVertical={8}
      backgroundColor={milestone.achieved ? '$green3' : '$color3'}
      borderColor={milestone.achieved ? '$green7' : '$color5'}
      borderWidth={1}
      borderRadius={12}
      opacity={milestone.achieved ? 1 : 0.7}
    >
      <Trophy
        size={16}
        color={milestone.achieved ? '$green10' : '$color10'}
        data-testid="trophy-icon"
      />
      <Stack>
        <Text color={milestone.achieved ? '$green11' : '$color11'}>
          {milestone.label}
        </Text>
        <Text color="gray">
          {milestone.threshold}% milestone
        </Text>
      </Stack>
    </Row>
  )
})
