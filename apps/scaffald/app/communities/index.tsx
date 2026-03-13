import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { CommunitiesHubPage } from '@scf/core/features/communities/CommunitiesHubPage'

export default function CommunitiesIndexPage() {
  return (
    <DashboardPage
      leftContent={<CommunitiesHubPage />}
      showBreadcrumb={false}
      rightContent={null}
    />
  )
}
