import { DashboardPage } from '@app/core/features/dashboard/DashboardPage'
import { WorkLogCreateScreen } from '@app/core/features/work-logs/screens/WorkLogCreateScreen'
import { QuickLinksSidebar } from '@app/ui'

export default function WorkLogCreatePage() {
  return (
    <DashboardPage
      showBreadcrumb={false}
      leftContent={<WorkLogCreateScreen />}
      rightContent={<QuickLinksSidebar />}
    />
  )
}
