import { YStack, Text, H4 } from 'tamagui'
import { DashboardWidget } from '@app/ui'

/**
 * Discover Jobs Left Component
 * Left panel content for the jobs discovery page
 */
export function DiscoverJobsLeft() {
  return (
    <YStack gap="$4">
      <DashboardWidget>
        <YStack gap="$3">
          <H4>Jobs Discovery</H4>
          <Text color="$color11">Discover and apply for jobs in your area.</Text>
          <Text color="$color10" fontSize="$3">
            This is a placeholder component. Add your jobs discovery content here.
          </Text>
        </YStack>
      </DashboardWidget>
    </YStack>
  )
}
