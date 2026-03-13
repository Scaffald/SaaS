import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { ConnectionsManagementPage } from '@scf/core/features/connections/ConnectionsManagementPage'

export default function CommunitiesConnectionsPage() {
  return (
    <DashboardPage
      leftContent={<ConnectionsManagementPage />}
      showBreadcrumb={false}
      rightContent={null}
    />
  )
}
