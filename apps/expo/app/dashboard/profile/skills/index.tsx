import { ProfileSkillsScreen } from '@app/core/features/profile/profile-skills-screen'
import { DashboardLayout } from '@app/ui/src/components/layouts/DashboardLayout'

export default function ProfileSkillsPage() {
  return (
    <DashboardLayout header={{ title: 'Skills Profile' }} rightContent={<ProfileSkillsScreen />} />
  )
}
