import { ROUTES } from '@scf/core/constants/routes'
import { ProfilePage } from '@scf/core/features/profile/ProfilePage'
import { ProfileGeneralLeft } from '@scf/core/features/profile/profile-general-left'
import { ProfileGeneralRight } from '@scf/core/features/profile/profile-general-right'

export default function ProfileGeneralPage() {
  return (
    <ProfilePage
      breadcrumbs={[
        { route: ROUTES.DASHBOARD.PROFILE },
        { route: ROUTES.DASHBOARD.PROFILE.GENERAL },
      ]}
      leftContent={<ProfileGeneralLeft />}
      rightContent={<ProfileGeneralRight />}
    />
  )
}
