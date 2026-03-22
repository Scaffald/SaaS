import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { ConnectionsManagementPage } from '@scf/core/features/connections/ConnectionsManagementPage'
import { CommunityStatsWidget } from '@scf/core/features/communities'

export default function CommunitiesConnectionsPage() {
  return (
    <DashboardPage
      leftContent={<ConnectionsManagementPage />}
      showBreadcrumb={false}
      rightContent={<CommunityStatsWidget />}
    />
  )
}
