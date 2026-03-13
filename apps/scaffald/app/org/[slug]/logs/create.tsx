import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { WorkLogCreateScreen } from '@scf/core/features/work-logs/screens/WorkLogCreateScreen'

export default function OrgLogCreatePage() {
  return (
    <DashboardPage
      showBreadcrumb={false}
      leftContent={<WorkLogCreateScreen />}
      rightContent={null}
    />
  )
}
