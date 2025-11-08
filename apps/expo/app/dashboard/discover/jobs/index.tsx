import { DiscoverJobsScreen } from '@app/core/features/discover/discover-jobs-screen'
import { DashboardLayout } from '@app/ui'

export default function DiscoverJobsPage() {
  const { left, right } = DiscoverJobsScreen()
  return <DashboardLayout leftContent={left} rightContent={right} />
}
