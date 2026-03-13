import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { BookmarksPage } from '@scf/core/features/communities/BookmarksPage'

export default function BookmarksScreen() {
  return (
    <DashboardPage
      leftContent={<BookmarksPage />}
      showBreadcrumb={false}
      rightContent={null}
    />
  )
}
