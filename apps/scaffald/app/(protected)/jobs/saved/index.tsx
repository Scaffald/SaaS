import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { SavedJobsScreen } from '@scf/core/features/discover/SavedJobsScreen'

export default function SavedJobsPage() {
  return (
    <DashboardPage
      showBreadcrumb={false}
      pageTitle="Saved jobs"
      screenKicker="The board works for you"
      screenTip="Postings you have kept to come back to. Each still shows its real pay and requirements."
      leftContent={<SavedJobsScreen />}
    />
  )
}
