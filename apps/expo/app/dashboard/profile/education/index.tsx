import { ROUTES } from '@app/core/constants/routes'
import { ProfilePage } from '@app/core/features/profile/ProfilePage'
import { ProfileEducationLeft } from '@app/core/features/profile/profile-education-left'
import { ProfileEducationRight } from '@app/core/features/profile/profile-education-right'
import { QuickLinksSidebar } from '@app/ui'

export default function ProfileEducationPage() {
  return (
    <ProfilePage
      breadcrumbs={[
        { route: ROUTES.DASHBOARD.PROFILE },
        { route: ROUTES.DASHBOARD.PROFILE.EDUCATION },
      ]}
      leftContent={<ProfileEducationLeft />}
      rightContent={
        <QuickLinksSidebar>
          <ProfileEducationRight />
        </QuickLinksSidebar>
      }
    />
  )
}
