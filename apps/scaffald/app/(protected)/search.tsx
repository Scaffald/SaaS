import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { SearchScreen } from '@scf/core/features/search'

export default function SearchPage() {
  return (
    <DashboardPage
      showBreadcrumb={false}
      pageTitle="Search"
      leftContent={<SearchScreen />}
    />
  )
}
