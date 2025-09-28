import { ProfileGeneralScreen } from '@app/core/features/profile/profile-general-screen'
import { DashboardLayout } from '@app/ui/src/components/layouts/DashboardLayout'

export default function ProfileGeneralPage() {
  return (
    <DashboardLayout
      header={{ title: 'General Profile' }}
      rightContent={<ProfileGeneralScreen />}
    />
  )
}
