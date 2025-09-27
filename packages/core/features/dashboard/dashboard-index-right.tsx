import { YStack } from '@app/ui'

import { DashboardErrorBoundary, NewsFeedCard } from './components/dashboard'

export function DashboardIndexRight() {
  return (
    <YStack gap="$5">
      <DashboardErrorBoundary>
        <NewsFeedCard />
      </DashboardErrorBoundary>
    </YStack>
  )
}
