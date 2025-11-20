import { ROUTES } from '@app/core/constants/routes'
import { ProfilePage } from '@app/core/features/profile/ProfilePage'
import { ImportReviewScreen } from '@app/core/features/profile-import/components/ImportReviewScreen'
import { QuickLinksSidebar } from '@app/ui'

export default function ProfileImportReviewPage() {
  return (
    <ProfilePage
      breadcrumbs={[
        { route: ROUTES.DASHBOARD.PROFILE },
        { route: ROUTES.DASHBOARD.PROFILE.IMPORT_REVIEW },
      ]}
      leftContent={<ImportReviewScreen />}
      rightContent={<QuickLinksSidebar />}
    />
  )
}
