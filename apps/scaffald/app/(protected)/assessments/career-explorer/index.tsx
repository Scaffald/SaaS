import { CareerExplorerScreen } from '@scf/core/features/career-explorer/CareerExplorerScreen'
import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'

export default function CareerExplorerRoute() {
  const { leftContent, rightContent } = CareerExplorerScreen()

  return (
    <DashboardPage
      breadcrumbs={[{ label: 'Career Explorer' }]}
      screenKicker="Career discovery"
      screenTip="Search and discover careers from 1,000+ occupations in the O*NET database."
      leftContent={leftContent}
      rightContent={rightContent}
    />
  )
}
