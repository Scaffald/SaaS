import { CareerExplorerScreen } from '@scf/core/features/career-explorer/CareerExplorerScreen'
import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'

export default function CareerExplorerRoute() {
  const { leftContent, rightContent } = CareerExplorerScreen()

  return (
    <DashboardPage
      breadcrumbs={[{ label: 'Career Explorer' }]}
      leftContent={leftContent}
      rightContent={rightContent}
    />
  )
}
