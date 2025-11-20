import { DashboardIndexLeft } from '@app/core/features/dashboard/dashboard-index-left'
import { DashboardIndexRight } from '@app/core/features/dashboard/dashboard-index-right'
import { DashboardLayout } from '@app/ui'

export default function Screen() {
  return (
    <DashboardLayout
      showBreadcrumb={false}
      leftContent={<DashboardIndexLeft />}
      rightContent={<DashboardIndexRight />}
    />
  )
}
