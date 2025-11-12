import { WorkLogDetailScreen } from '@app/core/features/work-logs/screens/WorkLogDetailScreen'
import { DashboardLayout } from '@app/ui'

export default function WorkLogDetailPage() {
  return <DashboardLayout leftContent={<WorkLogDetailScreen />} />
}
