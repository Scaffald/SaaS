import { ProfileCertificationsScreen } from '@app/core/features/profile/profile-certifications-screen'
import { DashboardLayout } from '@app/ui/src/components/layouts/DashboardLayout'

export default function ProfileCertificationsPage() {
  return (
    <DashboardLayout
      header={{ title: 'Certifications Profile' }}
      rightContent={<ProfileCertificationsScreen />}
    />
  )
}
