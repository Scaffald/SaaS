import { DashboardPage } from '@app/core/features/dashboard/DashboardPage'
import { WorkLogDetailScreen } from '@app/core/features/work-logs/screens/WorkLogDetailScreen'
import { QuickLinksSidebar } from '@app/ui'

export default function WorkLogDetailPage() {
  return (
    <DashboardPage leftContent={<WorkLogDetailScreen />} rightContent={<QuickLinksSidebar />} />
  )
}
