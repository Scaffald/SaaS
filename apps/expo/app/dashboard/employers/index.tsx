import { DashboardPage } from '@app/core/features/dashboard/DashboardPage'
import { DiscoverEmployersScreen } from '@app/core/features/discover/discover-employers-screen'
import { QuickLinksSidebar } from '@app/ui'

export default function DiscoverEmployersPage() {
  const { left, right } = DiscoverEmployersScreen()
  return (
    <DashboardPage
      showBreadcrumb={false}
      leftContent={left}
      rightContent={<QuickLinksSidebar>{right}</QuickLinksSidebar>}
    />
  )
}
