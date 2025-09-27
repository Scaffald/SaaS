import { DashboardLayout } from '@app/ui'
import { DashboardIndexLeft } from '@app/core/features/dashboard/dashboard-index-left'
import { DashboardIndexRight } from '@app/core/features/dashboard/dashboard-index-right'

export default function Screen() {
  return (
    <DashboardLayout
      header={{ title: 'Dashboard' }}
      leftContent={<DashboardIndexLeft />}
      rightContent={<DashboardIndexRight />}
      leftWidth="61.8%"
      isHomePage={true}
    />
  )
}
