import { YStack } from '@app/ui'
import { DashboardErrorBoundary } from './components/dashboard/error-boundary'
import { NewsFeedCard, ProjectOverviewWidget } from './components/dashboard/right-rail'

export function DashboardIndexRight() {
  return (
    <YStack py="$4" gap="$4">
      <DashboardErrorBoundary>
        <ProjectOverviewWidget />
      </DashboardErrorBoundary>
      <DashboardErrorBoundary>
        <NewsFeedCard />
      </DashboardErrorBoundary>
    </YStack>
  )
}
