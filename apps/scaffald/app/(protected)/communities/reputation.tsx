import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { ReputationDashboardPage } from '@scf/core/features/communities/ReputationDashboardPage'
import { CommunityActivityWidget } from '@scf/core/features/communities'

export default function CommunitiesReputationScreen() {
  return (
    <DashboardPage
      screenTip="Your reputation in the Scaffald community. Earn points by contributing quality content."
      leftContent={<ReputationDashboardPage />}
      showBreadcrumb={false}
      rightContent={<CommunityActivityWidget />}
    />
  )
}
