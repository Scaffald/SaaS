import { ProfileExperienceLeft } from '@app/core/features/profile/profile-experience-left'
import { ProfileExperienceRight } from '@app/core/features/profile/profile-experience-right'
import { DashboardLayout, QuickLinksSidebar } from '@app/ui'

export default function ProfileExperiencePage() {
  return (
    <DashboardLayout
      leftContent={<ProfileExperienceLeft />}
      rightContent={
        <QuickLinksSidebar>
          <ProfileExperienceRight />
        </QuickLinksSidebar>
      }
    />
  )
}
