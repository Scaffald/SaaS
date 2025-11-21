import { ROUTES } from '@app/core/constants/routes'
import { IdVerificationContent, IdVerificationRight } from '@app/core/features/id-verification'
import { ProfilePage } from '@app/core/features/profile/ProfilePage'

export default function IdVerificationScreen() {
  return (
    <ProfilePage
      breadcrumbs={[
        { route: ROUTES.DASHBOARD.PROFILE },
        { route: ROUTES.DASHBOARD.PROFILE.ID_VERIFICATION },
      ]}
      leftContent={<IdVerificationContent />}
      rightContent={<IdVerificationRight />}
    />
  )
}
