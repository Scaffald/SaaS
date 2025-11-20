import { DashboardPage } from '@app/core/features/dashboard/DashboardPage'
import { WorkLogListScreen } from '@app/core/features/work-logs/screens/WorkLogListScreen'

export default function WorkLogsIndexPage() {
  return (
    <DashboardPage showBreadcrumb={false} leftContent={<WorkLogListScreen />} rightContent={null} />
  )
}
