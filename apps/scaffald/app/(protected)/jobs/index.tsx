import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { DiscoverJobsScreen } from '@scf/core/features/discover/discover-jobs-screen'

export default function DiscoverJobsPage() {
  const { header, left, right, footer } = DiscoverJobsScreen()
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
