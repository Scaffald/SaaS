import { DashboardPage } from '@app/core/features/dashboard/DashboardPage'
import { DiscoverWorkersScreen } from '@app/core/features/discover/discover-workers-screen'
import { QuickLinksSidebar } from '@app/ui'

export default function DiscoverWorkersPage() {
  const { left, right } = DiscoverWorkersScreen()
  return (
    <DashboardPage
      showBreadcrumb={false}
      leftContent={left}
      rightContent={<QuickLinksSidebar>{right}</QuickLinksSidebar>}
    />
  )
}
