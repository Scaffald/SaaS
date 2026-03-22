import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { VisibilityScreen } from '@scf/core/features/analytics'

export default function VisibilityPage() {
  return (
    <DashboardPage
      showBreadcrumb={false}
      pageTitle="Visibility"
      fullWidth
      leftContent={<VisibilityScreen />}
    />
  )
}
