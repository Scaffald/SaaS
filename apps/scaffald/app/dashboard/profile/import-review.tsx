import { ROUTES } from '@scf/core/constants/routes'
import { ProfilePage } from '@scf/core/features/profile/ProfilePage'
import { ImportReviewScreen } from '@scf/core/features/profile-import/components/ImportReviewScreen'

export default function ProfileImportReviewPage() {
  return (
    <ProfilePage
      breadcrumbs={[
        { route: ROUTES.DASHBOARD.PROFILE },
        { route: ROUTES.DASHBOARD.PROFILE.IMPORT_REVIEW },
      ]}
      leftContent={<ImportReviewScreen />}
      rightContent={null}
    />
  )
}
