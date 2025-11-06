import { ProfileEmploymentLeft } from '@app/core/features/profile/profile-employment-left'
import { ProfileEmploymentRight } from '@app/core/features/profile/profile-employment-right'
import { DashboardLayout } from '@app/ui'

export default function ProfileEmploymentPage() {
  return (
    <DashboardLayout
      leftContent={<ProfileEmploymentLeft />}
      rightContent={<ProfileEmploymentRight />}
    />
  )
}
