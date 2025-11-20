import { ROUTES } from '@app/core/constants/routes'
import { ProfileCertificationsHighlightProvider } from '@app/core/features/profile/profile-certifications-highlight-context'
import { ProfilePage } from '@app/core/features/profile/ProfilePage'
import { ProfileCertificationsLeft } from '@app/core/features/profile/profile-certifications-left'
import { ProfileCertificationsRight } from '@app/core/features/profile/profile-certifications-right'
import { QuickLinksSidebar } from '@app/ui'

export default function ProfileCertificationsPage() {
  return (
    <ProfileCertificationsHighlightProvider>
      <ProfilePage
        breadcrumbs={[
          { route: ROUTES.DASHBOARD.PROFILE },
          { route: ROUTES.DASHBOARD.PROFILE.CERTIFICATIONS },
        ]}
        leftContent={<ProfileCertificationsLeft />}
        rightContent={
          <QuickLinksSidebar>
            <ProfileCertificationsRight />
          </QuickLinksSidebar>
        }
      />
    </ProfileCertificationsHighlightProvider>
  )
}
