import { ProfileEducationScreen } from '@app/core/features/profile/profile-education-screen'
import { DashboardLayout } from '@app/ui/src/components/layouts/DashboardLayout'

export default function ProfileEducationPage() {
  return (
    <DashboardLayout
      header={{ title: 'Education Profile' }}
      rightContent={<ProfileEducationScreen />}
    />
  )
}
