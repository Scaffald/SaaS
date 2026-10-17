import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { WorkLogListScreen } from '@scf/core/features/work-logs/screens/WorkLogListScreen'

export default function WorkLogsIndexPage() {
  return (
    <DashboardPage
      showBreadcrumb={false}
      screenKicker="Your organizations"
      screenTip="Work your crews have logged — hours, tasks and the skills they used."
      leftContent={<WorkLogListScreen />}
      rightContent={null}
    />
  )
}
