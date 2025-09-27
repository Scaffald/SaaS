import { DashboardLayout } from '@app/ui'
import { DashboardIndexScreen } from '@app/core/features/dashboard/dashboard-index-screen'

export default function Screen() {
  return (
    <DashboardLayout
      header={{ title: 'Dashboard' }}
      rightContent={<DashboardIndexScreen />}
      isHomePage={true}
    />
  )
}
