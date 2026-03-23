import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { DiscoverWorkersScreen } from '@scf/core/features/discover/discover-workers-screen'

export default function DiscoverWorkersPage() {
  const { header, left, right, footer } = DiscoverWorkersScreen()
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
