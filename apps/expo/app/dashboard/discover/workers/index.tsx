import { DiscoverWorkersScreen } from '@app/core/features/discover/discover-workers-screen'
import { DashboardLayout, QuickLinksSidebar } from '@app/ui'

export default function DiscoverWorkersPage() {
  const { left, right } = DiscoverWorkersScreen()
  return (
    <DashboardLayout
      leftContent={left}
      rightContent={<QuickLinksSidebar>{right}</QuickLinksSidebar>}
    />
  )
}
