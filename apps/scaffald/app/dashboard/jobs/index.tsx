import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { DiscoverJobsScreen } from '@scf/core/features/discover/discover-jobs-screen'

export default function DiscoverJobsPage() {
  const { left, right } = DiscoverJobsScreen()
  return <DashboardPage showBreadcrumb={false} leftContent={left} rightContent={right} />
}
