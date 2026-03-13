import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { ReputationDashboardPage } from '@scf/core/features/communities/ReputationDashboardPage'

export default function CommunitiesReputationScreen() {
  return (
    <DashboardPage
      leftContent={<ReputationDashboardPage />}
      showBreadcrumb={false}
      rightContent={null}
    />
  )
}
