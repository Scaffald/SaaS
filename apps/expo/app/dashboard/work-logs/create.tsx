import { WorkLogCreateScreen } from '@app/core/features/work-logs/screens/WorkLogCreateScreen'
import { DashboardLayout, QuickLinksSidebar } from '@app/ui'

export default function WorkLogCreatePage() {
  return (
    <DashboardLayout leftContent={<WorkLogCreateScreen />} rightContent={<QuickLinksSidebar />} />
  )
}
