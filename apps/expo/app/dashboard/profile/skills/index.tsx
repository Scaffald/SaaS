import { ROUTES } from '@app/core/constants/routes'
import {
  ProfileSkillsLeft,
  ProfileSkillsProvider,
  ProfileSkillsRight,
} from '@app/core/features/profile'
import { ProfilePage } from '@app/core/features/profile/ProfilePage'
import { QuickLinksSidebar } from '@app/ui'

export default function ProfileSkillsPage() {
  return (
    <ProfileSkillsProvider>
      <ProfilePage
        breadcrumbs={[
          { route: ROUTES.DASHBOARD.PROFILE },
          { route: ROUTES.DASHBOARD.PROFILE.SKILLS },
        ]}
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
