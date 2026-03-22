import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { DashboardIndexLeft } from '@scf/core/features/dashboard/dashboard-index-left'
import { DashboardIndexRight } from '@scf/core/features/dashboard/dashboard-index-right'

export default function Screen() {
  return (
    <DashboardPage
      showBreadcrumb={false}
      leftContent={<DashboardIndexLeft />}
      rightContent={<DashboardIndexRight />}
    />
  )
}
