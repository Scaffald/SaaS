import { ExperienceEditProvider } from '@app/core/features/profile/contexts/experience-edit-context'
import { ProfileExperienceLeft } from '@app/core/features/profile/profile-experience-left'
import { ProfileExperienceRight } from '@app/core/features/profile/profile-experience-right'
import { ProfileLayout, QuickLinksSidebar } from '@app/ui'

export default function ProfileExperiencePage() {
  return (
    <ExperienceEditProvider>
      <ProfileLayout
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
