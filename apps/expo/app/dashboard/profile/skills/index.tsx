import {
  ProfileSkillsLeft,
  ProfileSkillsProvider,
  ProfileSkillsRight,
} from '@app/core/features/profile'
import { DashboardLayout, QuickLinksSidebar } from '@app/ui'

export default function ProfileSkillsPage() {
  return (
    <ProfileSkillsProvider>
      <DashboardLayout
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
