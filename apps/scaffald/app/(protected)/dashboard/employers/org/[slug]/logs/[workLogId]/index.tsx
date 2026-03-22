import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { WorkLogDetailScreen } from '@scf/core/features/work-logs/screens/WorkLogDetailScreen'

export default function OrgLogDetailPage() {
  return <DashboardPage leftContent={<WorkLogDetailScreen />} rightContent={null} />
}
