import { ROUTES } from '@app/core/constants/routes'
import { ProfilePage } from '@app/core/features/profile/ProfilePage'
import { ProfileEmploymentLeft } from '@app/core/features/profile/profile-employment-left'
import { ProfileEmploymentRight } from '@app/core/features/profile/profile-employment-right'
import { QuickLinksSidebar } from '@app/ui'

export default function ProfileEmploymentPage() {
  return (
    <ProfilePage
      breadcrumbs={[
        { route: ROUTES.DASHBOARD.PROFILE },
        { route: ROUTES.DASHBOARD.PROFILE.EMPLOYMENT },
      ]}
      leftContent={<ProfileEmploymentLeft />}
      rightContent={
        <QuickLinksSidebar>
          <ProfileEmploymentRight />
        </QuickLinksSidebar>
      }
    />
  )
}
