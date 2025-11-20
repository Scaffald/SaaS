import { ROUTES } from '@app/core/constants/routes'
import { ProfilePage } from '@app/core/features/profile/ProfilePage'
import { ProfileGeneralLeft } from '@app/core/features/profile/profile-general-left'
import { ProfileGeneralRight } from '@app/core/features/profile/profile-general-right'

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
