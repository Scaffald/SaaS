import { ProfileCertificationsHighlightProvider } from '@app/core/features/profile/profile-certifications-highlight-context'
import { ProfileCertificationsLeft } from '@app/core/features/profile/profile-certifications-left'
import { ProfileCertificationsRight } from '@app/core/features/profile/profile-certifications-right'
import { ProfileLayout, QuickLinksSidebar } from '@app/ui'

export default function ProfileCertificationsPage() {
  return (
    <ProfileCertificationsHighlightProvider>
      <ProfileLayout
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
