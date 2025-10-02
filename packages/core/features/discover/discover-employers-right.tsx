import { YStack, Text, H4 } from 'tamagui'
import { DashboardWidget } from '@app/ui'

/**
 * Discover Employers Right Component
 * Right panel content for the employers discovery page
 */
export function DiscoverEmployersRight() {
  return (
    <YStack gap="$4">
      <DashboardWidget>
        <YStack gap="$3">
          <H4>Employer Filters</H4>
          <Text color="$color11">Filter and search for employers based on your criteria.</Text>
          <Text color="$color10" fontSize="$3">
            This is a placeholder component. Add filters and search functionality here.
          </Text>
        </YStack>
      </DashboardWidget>
    </YStack>
  )
}
