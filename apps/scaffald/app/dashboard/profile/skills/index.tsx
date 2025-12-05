import { ROUTES } from '@scf/core/constants/routes'
import {
  ProfileSkillsLeft,
  ProfileSkillsProvider,
  ProfileSkillsRight,
} from '@scf/core/features/profile'
import { ProfilePage } from '@scf/core/features/profile/ProfilePage'

export default function ProfileSkillsPage() {
  return (
    <ProfileSkillsProvider>
      <ProfilePage
        breadcrumbs={[
          { route: ROUTES.DASHBOARD.PROFILE },
          { route: ROUTES.DASHBOARD.PROFILE.SKILLS },
        ]}
        leftContent={<ProfileSkillsLeft />}
        rightContent={<ProfileSkillsRight />}
      />
    </ProfileSkillsProvider>
  )
}
