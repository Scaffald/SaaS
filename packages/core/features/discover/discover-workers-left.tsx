import { YStack, Text, H4 } from 'tamagui'
import { DashboardWidget } from '@app/ui'

/**
 * Discover Workers Left Component
 * Left panel content for the workers discovery page
 */
export function DiscoverWorkersLeft() {
  return (
    <YStack gap="$4">
      <DashboardWidget>
        <YStack gap="$3">
          <H4>Workers Discovery</H4>
          <Text color="$color11">Discover and connect with skilled workers in your area.</Text>
          <Text color="$color10" fontSize="$3">
            This is a placeholder component. Add your workers discovery content here.
          </Text>
        </YStack>
      </DashboardWidget>
    </YStack>
  )
}
