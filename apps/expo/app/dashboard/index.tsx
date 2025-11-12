import { DashboardLayout, QuickLinksSidebar } from '@app/ui'
import { DashboardIndexLeft } from '@app/core/features/dashboard/dashboard-index-left'
import { DashboardIndexRight } from '@app/core/features/dashboard/dashboard-index-right'

export default function Screen() {
  return (
    <DashboardLayout
      showBreadcrumb={false}
      leftContent={<DashboardIndexLeft />}
      rightContent={<DashboardIndexRight />}
    />
  )
}
