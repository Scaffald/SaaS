import { WorkLogDetailScreen } from '@app/core/features/work-logs/screens/WorkLogDetailScreen'
import { DashboardLayout, QuickLinksSidebar } from '@app/ui'

export default function WorkLogDetailPage() {
  return (
    <DashboardLayout leftContent={<WorkLogDetailScreen />} rightContent={<QuickLinksSidebar />} />
  )
}
