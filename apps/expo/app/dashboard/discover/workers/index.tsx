import { DiscoverWorkersScreen } from '@app/core/features/discover/discover-workers-screen'
import { DashboardLayout } from '@app/ui/src/components/layouts/DashboardLayout'

export default function DiscoverWorkersPage() {
  const { left, right } = DiscoverWorkersScreen()
  return <DashboardLayout leftContent={left} rightContent={right} />
}
