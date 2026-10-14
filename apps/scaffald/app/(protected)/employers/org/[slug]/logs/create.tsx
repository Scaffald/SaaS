import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import {
  WORK_LOG_CREATE_TIP,
  WorkLogCreateScreen,
} from '@scf/core/features/work-logs/screens/WorkLogCreateScreen'

export default function OrgLogCreatePage() {
  return (
    <DashboardPage
      showBreadcrumb={false}
      screenTip={WORK_LOG_CREATE_TIP}
      leftContent={<WorkLogCreateScreen />}
      rightContent={null}
    />
  )
}
