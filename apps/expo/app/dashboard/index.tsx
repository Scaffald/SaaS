import { DashboardPage } from '@app/core/features/dashboard/DashboardPage'
import { DashboardIndexLeft } from '@app/core/features/dashboard/dashboard-index-left'
import { DashboardIndexRight } from '@app/core/features/dashboard/dashboard-index-right'

export default function Screen() {
  return (
    <DashboardPage
      showBreadcrumb={false}
      leftContent={<DashboardIndexLeft />}
      rightContent={<DashboardIndexRight />}
    />
  )
}
