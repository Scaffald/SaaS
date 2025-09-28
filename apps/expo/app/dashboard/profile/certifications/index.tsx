import { ProfileCertificationsLeft } from '@app/core/features/profile/profile-certifications-left'
import { ProfileCertificationsRight } from '@app/core/features/profile/profile-certifications-right'
import { DashboardLayout } from '@app/ui/src/components/layouts/DashboardLayout'

export default function ProfileCertificationsPage() {
  return (
    <DashboardLayout
      leftContent={<ProfileCertificationsLeft />}
      rightContent={<ProfileCertificationsRight />}
    />
  )
}
