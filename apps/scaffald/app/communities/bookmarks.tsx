import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { BookmarksPage } from '@scf/core/features/communities/BookmarksPage'
import { CommunityStatsWidget } from '@scf/core/features/communities'

export default function CommunitiesBookmarksScreen() {
  return (
    <DashboardPage
      leftContent={<BookmarksPage />}
      showBreadcrumb={false}
      rightContent={<CommunityStatsWidget />}
    />
  )
}
