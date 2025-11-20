import { DashboardPage } from '@app/core/features/dashboard/DashboardPage'
import { DiscoverJobsScreen } from '@app/core/features/discover/discover-jobs-screen'
import { QuickLinksSidebar } from '@app/ui'

export default function DiscoverJobsPage() {
  const { left, right } = DiscoverJobsScreen()
  return (
    <DashboardPage
      showBreadcrumb={false}
      leftContent={left}
      rightContent={<QuickLinksSidebar>{right}</QuickLinksSidebar>}
    />
  )
}
