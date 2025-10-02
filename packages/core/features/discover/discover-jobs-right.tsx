import { YStack, Text, H4 } from 'tamagui'
import { DashboardWidget } from '@app/ui'

/**
 * Discover Jobs Right Component
 * Right panel content for the jobs discovery page
 */
export function DiscoverJobsRight() {
  return (
    <YStack gap="$4">
      <DashboardWidget>
        <YStack gap="$3">
          <H4>Job Filters</H4>
          <Text color="$color11">Filter and search for jobs based on your criteria.</Text>
          <Text color="$color10" fontSize="$3">
            This is a placeholder component. Add filters and search functionality here.
          </Text>
        </YStack>
      </DashboardWidget>
    </YStack>
  )
}
