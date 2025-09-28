import { ProfileEmploymentScreen } from '@app/core/features/profile/profile-employment-screen'
import { DashboardLayout } from '@app/ui/src/components/layouts/DashboardLayout'

export default function ProfileEmploymentPage() {
  return (
    <DashboardLayout
      header={{ title: 'Employment Profile' }}
      rightContent={<ProfileEmploymentScreen />}
    />
  )
}
