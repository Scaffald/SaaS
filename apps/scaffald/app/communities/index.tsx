import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { CommunitiesHubPage } from '@scf/core/features/communities/CommunitiesHubPage'
import { CommunitiesRightColumn } from '@scf/core/features/communities'

export default function CommunitiesIndexPage() {
  return (
    <DashboardPage
      leftContent={<CommunitiesHubPage />}
      showBreadcrumb={false}
      rightContent={<CommunitiesRightColumn />}
    />
  )
}
