import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { SearchScreen } from '@scf/core/features/analytics'

export default function SearchAnalyticsPage() {
  return (
    <DashboardPage
      showBreadcrumb={false}
      pageTitle="Search Analytics"
      fullWidth
      leftContent={<SearchScreen />}
    />
  )
}
