import { ROUTES } from '@scf/core/constants/routes'
import { ProfilePage } from '@scf/core/features/profile/ProfilePage'
import { ProfileEmploymentLeft } from '@scf/core/features/profile/profile-employment-left'
import { ProfileEmploymentRight } from '@scf/core/features/profile/profile-employment-right'

export default function ProfileEmploymentPage() {
  return (
    <ProfilePage
      breadcrumbs={[
        { route: ROUTES.DASHBOARD.PROFILE },
        { route: ROUTES.DASHBOARD.PROFILE.EMPLOYMENT },
      ]}
      leftContent={<ProfileEmploymentLeft />}
      rightContent={<ProfileEmploymentRight />}
    />
  )
}
