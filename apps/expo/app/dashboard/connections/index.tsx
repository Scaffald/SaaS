import { DashboardPage } from '@app/core/features/dashboard/DashboardPage'
import { ConnectionsManagementPage } from '@app/core/features/connections/ConnectionsManagementPage'

export default function DashboardConnectionsIndexPage() {
  return (
    <DashboardPage
      leftContent={<ConnectionsManagementPage />}
      showBreadcrumb={false}
      rightContent={null}
    />
  )
}
