import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { SavedJobsScreen } from '@scf/core/features/discover/SavedJobsScreen'

export default function SavedJobsPage() {
  return (
    <DashboardPage
      showBreadcrumb={false}
      pageTitle="Saved Jobs"
      leftContent={<SavedJobsScreen />}
    />
  )
}
