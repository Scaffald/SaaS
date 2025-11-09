import {
  ProfileSkillsLeft,
  ProfileSkillsProvider,
  ProfileSkillsRight,
} from '@app/core/features/profile'
import { DashboardLayout } from '@app/ui'

export default function ProfileSkillsPage() {
  return (
    <ProfileSkillsProvider>
      <DashboardLayout leftContent={<ProfileSkillsLeft />} rightContent={<ProfileSkillsRight />} />
    </ProfileSkillsProvider>
  )
}
