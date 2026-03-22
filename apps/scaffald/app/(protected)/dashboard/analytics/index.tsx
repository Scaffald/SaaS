import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { AnalyticsOverviewScreen } from '@scf/core/features/analytics'

export default function AnalyticsOverviewPage() {
  return (
    <DashboardPage
      showBreadcrumb={false}
      pageTitle="Analytics"
      fullWidth
      leftContent={<AnalyticsOverviewScreen />}
    />
  )
}
