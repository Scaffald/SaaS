import { ProfileSkillsLeft } from '@app/core/features/profile/profile-skills-left'
import { ProfileSkillsRight } from '@app/core/features/profile/profile-skills-right'
import { DashboardLayout } from '@app/ui/src/components/layouts/DashboardLayout'

export default function ProfileSkillsPage() {
  return (
    <DashboardLayout leftContent={<ProfileSkillsLeft />} rightContent={<ProfileSkillsRight />} />
  )
}
