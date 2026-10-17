import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { AnalyticsOverviewScreen } from '@scf/core/features/analytics'

export default function AnalyticsOverviewPage() {
  return (
    <DashboardPage
      screenKicker="Your reach"
      screenTip="Understand your platform exposure."
      showBreadcrumb={false}
      pageTitle="Analytics"
      fullWidth
      leftContent={<AnalyticsOverviewScreen />}
    />
  )
}
