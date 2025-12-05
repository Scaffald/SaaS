import { ROUTES } from '@scf/core/constants/routes'
import { IdVerificationContent, IdVerificationRight } from '@scf/core/features/id-verification'
import { ProfilePage } from '@scf/core/features/profile/ProfilePage'

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
