import { YStack } from 'tamagui'
import { TeamInvitationsWidget } from '@app/core/features/dashboard/components'
import { NewsWidget } from '@app/core/features/news'

export function DashboardIndexRight() {
  return (
    <YStack gap="$4">
      <TeamInvitationsWidget />
      <NewsWidget industry="construction" maxItems={10} />
    </YStack>
  )
}
