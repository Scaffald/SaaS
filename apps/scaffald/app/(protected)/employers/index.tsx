import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { DiscoverEmployersScreen } from '@scf/core/features/discover/discover-employers-screen'

export default function DiscoverEmployersPage() {
  const { header, left, right, footer } = DiscoverEmployersScreen()
  return (
    <>
      <DashboardPage
        showBreadcrumb={false}
        headerContent={header}
        leftContent={left}
        rightContent={right}
      />
      {footer}
    </>
  )
}
