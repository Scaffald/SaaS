import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { WorkLogListScreen } from '@scf/core/features/work-logs/screens/WorkLogListScreen'

export default function WorkLogsIndexPage() {
  return (
    <DashboardPage showBreadcrumb={false} leftContent={<WorkLogListScreen />} rightContent={null} />
  )
}
