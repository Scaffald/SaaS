import { DashboardPage } from '@app/core/features/dashboard/DashboardPage'
import { WorkLogCreateScreen } from '@app/core/features/work-logs/screens/WorkLogCreateScreen'

export default function WorkLogCreatePage() {
  return (
    <DashboardPage
      showBreadcrumb={false}
      leftContent={<WorkLogCreateScreen />}
      rightContent={null}
    />
  )
}
