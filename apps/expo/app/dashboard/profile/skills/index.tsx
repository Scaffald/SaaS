import {
  ProfileSkillsLeft,
  ProfileSkillsProvider,
  ProfileSkillsRight,
} from '@app/core/features/profile'
import { ProfileLayout, QuickLinksSidebar } from '@app/ui'

export default function ProfileSkillsPage() {
  return (
    <ProfileSkillsProvider>
      <ProfileLayout
        leftContent={<ProfileSkillsLeft />}
        rightContent={
          <QuickLinksSidebar>
            <ProfileSkillsRight />
          </QuickLinksSidebar>
        }
      />
    </ProfileSkillsProvider>
  )
}
