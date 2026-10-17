import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { DiscoverEmployersScreen } from '@scf/core/features/discover/discover-employers-screen'

export default function DiscoverEmployersPage() {
  const { header, left, right, footer } = DiscoverEmployersScreen()
  return (
    <>
      <DashboardPage
        showBreadcrumb={false}
        screenKicker="The board works for you"
        screenTip="Search employers the way you search jobs, then open one to see its open roles and record."
        headerContent={header}
        leftContent={left}
        rightContent={right}
      />
      {footer}
    </>
  )
}
