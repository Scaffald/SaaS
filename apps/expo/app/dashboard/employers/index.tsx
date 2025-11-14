import { DiscoverEmployersScreen } from '@app/core/features/discover/discover-employers-screen'
import { DashboardLayout, QuickLinksSidebar } from '@app/ui'

export default function DiscoverEmployersPage() {
  const { left, right } = DiscoverEmployersScreen()
  return (
    <DashboardLayout
      leftContent={left}
      rightContent={<QuickLinksSidebar>{right}</QuickLinksSidebar>}
    />
  )
}
