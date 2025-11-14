import { ProfileExperienceLeft } from '@app/core/features/profile/profile-experience-left'
import { ProfileExperienceRight } from '@app/core/features/profile/profile-experience-right'
import { ExperienceEditProvider } from '@app/core/features/profile/contexts/experience-edit-context'
import { DashboardLayout, QuickLinksSidebar } from '@app/ui'

export default function ProfileExperiencePage() {
  return (
    <ExperienceEditProvider>
      <DashboardLayout
        leftContent={<ProfileExperienceLeft />}
        rightContent={
          <QuickLinksSidebar>
            <ProfileExperienceRight />
          </QuickLinksSidebar>
        }
      />
    </ExperienceEditProvider>
  )
}
