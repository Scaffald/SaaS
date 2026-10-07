import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { SearchScreen } from '@scf/core/features/analytics'

export default function SearchAnalyticsPage() {
  return (
    <DashboardPage
      screenTip="Keywords and search queries that surface your profile."
      showBreadcrumb={false}
      pageTitle="Search Analytics"
      fullWidth
      leftContent={<SearchScreen />}
    />
  )
}
