import { YStack } from '@app/ui'
import { DashboardErrorBoundary } from './components/dashboard/error-boundary'
import { NewsFeedCard } from './components/dashboard/right-rail'


export function DashboardIndexRight() {
  return (
    <YStack gap="$5">
      <DashboardErrorBoundary>
        <NewsFeedCard />
      </DashboardErrorBoundary>
    </YStack>
  )
}
