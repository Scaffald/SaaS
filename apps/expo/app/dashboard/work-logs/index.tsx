import { DashboardPage } from '@app/core/features/dashboard/DashboardPage'
import { WorkLogListScreen } from '@app/core/features/work-logs/screens/WorkLogListScreen'
import { QuickLinksSidebar } from '@app/ui'

export default function WorkLogsIndexPage() {
  return (
    <DashboardPage
      showBreadcrumb={false}
      leftContent={<WorkLogListScreen />}
      rightContent={<QuickLinksSidebar />}
    />
  )
}
