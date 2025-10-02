import { YStack, Text, H4 } from 'tamagui'
import { DashboardWidget } from '@app/ui'

/**
 * Discover Employers Left Component
 * Left panel content for the employers discovery page
 */
export function DiscoverEmployersLeft() {
  return (
    <YStack gap="$4">
      <DashboardWidget>
        <YStack gap="$3">
          <H4>Employers Discovery</H4>
          <Text color="$color11">Discover and connect with employers in your area.</Text>
          <Text color="$color10" fontSize="$3">
            This is a placeholder component. Add your employers discovery content here.
          </Text>
        </YStack>
      </DashboardWidget>
    </YStack>
  )
}
