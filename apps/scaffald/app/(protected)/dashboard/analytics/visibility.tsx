import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { VisibilityScreen } from '@scf/core/features/analytics'

export default function VisibilityPage() {
  return (
    <DashboardPage
      screenTip="How often you appear in searches and recommendations."
      showBreadcrumb={false}
      pageTitle="Visibility"
      fullWidth
      leftContent={<VisibilityScreen />}
    />
  )
}
