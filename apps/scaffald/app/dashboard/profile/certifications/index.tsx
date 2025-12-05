import { ROUTES } from '@scf/core/constants/routes'
import { ProfileCertificationsHighlightProvider } from '@scf/core/features/profile/profile-certifications-highlight-context'
import { ProfilePage } from '@scf/core/features/profile/ProfilePage'
import { ProfileCertificationsLeft } from '@scf/core/features/profile/profile-certifications-left'
import { ProfileCertificationsRight } from '@scf/core/features/profile/profile-certifications-right'

export default function ProfileCertificationsPage() {
  return (
    <ProfileCertificationsHighlightProvider>
      <ProfilePage
        breadcrumbs={[
          { route: ROUTES.DASHBOARD.PROFILE },
          { route: ROUTES.DASHBOARD.PROFILE.CERTIFICATIONS },
        ]}
        leftContent={<ProfileCertificationsLeft />}
        rightContent={<ProfileCertificationsRight />}
      />
    </ProfileCertificationsHighlightProvider>
  )
}
