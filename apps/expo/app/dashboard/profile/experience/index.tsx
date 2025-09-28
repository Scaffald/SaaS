import { ProfileExperienceScreen } from '@app/core/features/profile/profile-experience-screen'
import { DashboardLayout } from '@app/ui/src/components/layouts/DashboardLayout'

export default function ProfileExperiencePage() {
  return (
    <DashboardLayout
      header={{ title: 'Experience Profile' }}
      rightContent={<ProfileExperienceScreen />}
    />
  )
}
