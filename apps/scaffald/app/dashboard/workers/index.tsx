import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { DiscoverWorkersScreen } from '@scf/core/features/discover/discover-workers-screen'

export default function DiscoverWorkersPage() {
  const { left, right } = DiscoverWorkersScreen()
  return <DashboardPage showBreadcrumb={false} leftContent={left} rightContent={right} />
}
