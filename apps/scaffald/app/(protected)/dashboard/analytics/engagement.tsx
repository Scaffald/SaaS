import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { EngagementScreen } from '@scf/core/features/analytics'

export default function EngagementPage() {
  return (
    <DashboardPage
      showBreadcrumb={false}
      pageTitle="Engagement"
      fullWidth
      leftContent={<EngagementScreen />}
    />
  )
}
