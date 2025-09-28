import { ProfileEducationLeft } from '@app/core/features/profile/profile-education-left'
import { ProfileEducationRight } from '@app/core/features/profile/profile-education-right'
import { DashboardLayout } from '@app/ui/src/components/layouts/DashboardLayout'

export default function ProfileEducationPage() {
  return (
    <DashboardLayout
      leftContent={<ProfileEducationLeft />}
      rightContent={<ProfileEducationRight />}
    />
  )
}
