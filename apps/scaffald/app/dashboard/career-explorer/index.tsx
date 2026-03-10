import { CareerExplorerScreen } from '@scf/core/features/career-explorer/CareerExplorerScreen'
import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'

export default function CareerExplorerRoute() {
  return (
    <DashboardPage
      breadcrumbs={[{ label: 'Career Explorer' }]}
      leftContent={<CareerExplorerScreen />}
      rightContent={null}
      fullWidth
    />
  )
}
