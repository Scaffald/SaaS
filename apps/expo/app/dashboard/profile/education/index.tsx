import { ProfileEducationLeft } from '@app/core/features/profile/profile-education-left'
import { ProfileEducationRight } from '@app/core/features/profile/profile-education-right'
import { ProfileLayout, QuickLinksSidebar } from '@app/ui'

export default function ProfileEducationPage() {
  return (
    <ProfileLayout
      leftContent={<ProfileEducationLeft />}
      rightContent={
        <QuickLinksSidebar>
          <ProfileEducationRight />
        </QuickLinksSidebar>
      }
    />
  )
}
