import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { ReputationDashboardPage } from '@scf/core/features/communities/ReputationDashboardPage'

export default function ReputationScreen() {
  return (
    <DashboardPage
      leftContent={<ReputationDashboardPage />}
      showBreadcrumb={false}
      rightContent={null}
    />
  )
}
