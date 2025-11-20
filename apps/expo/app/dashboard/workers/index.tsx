import { DashboardPage } from '@app/core/features/dashboard/DashboardPage'
import { DiscoverWorkersScreen } from '@app/core/features/discover/discover-workers-screen'

export default function DiscoverWorkersPage() {
  const { left, right } = DiscoverWorkersScreen()
  return <DashboardPage showBreadcrumb={false} leftContent={left} rightContent={right} />
}
