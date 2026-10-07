import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { BookmarksPage } from '@scf/core/features/communities/BookmarksPage'
import { CommunityStatsWidget } from '@scf/core/features/communities'

export default function CommunitiesBookmarksScreen() {
  return (
    <DashboardPage
      screenTip="Posts you’ve saved for later."
      leftContent={<BookmarksPage />}
      showBreadcrumb={false}
      rightContent={<CommunityStatsWidget />}
    />
  )
}
