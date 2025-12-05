import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { DiscoverEmployersScreen } from '@scf/core/features/discover/discover-employers-screen'

export default function DiscoverEmployersPage() {
  const { left, right } = DiscoverEmployersScreen()
  return <DashboardPage showBreadcrumb={false} leftContent={left} rightContent={right} />
}
