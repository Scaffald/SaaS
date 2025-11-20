import { ProfileEmploymentLeft } from '@app/core/features/profile/profile-employment-left'
import { ProfileEmploymentRight } from '@app/core/features/profile/profile-employment-right'
import { ProfileLayout, QuickLinksSidebar } from '@app/ui'

export default function ProfileEmploymentPage() {
  return (
    <ProfileLayout
      leftContent={<ProfileEmploymentLeft />}
      rightContent={
        <QuickLinksSidebar>
          <ProfileEmploymentRight />
        </QuickLinksSidebar>
      }
    />
  )
}
