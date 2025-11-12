import { WorkLogListScreen } from '@app/core/features/work-logs/screens/WorkLogListScreen'
import { DashboardLayout, QuickLinksSidebar } from '@app/ui'

export default function WorkLogsIndexPage() {
  return (
    <DashboardLayout leftContent={<WorkLogListScreen />} rightContent={<QuickLinksSidebar />} />
  )
}
