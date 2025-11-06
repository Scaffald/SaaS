import { ProfileExperienceLeft } from '@app/core/features/profile/profile-experience-left'
import { ProfileExperienceRight } from '@app/core/features/profile/profile-experience-right'
import { DashboardLayout } from '@app/ui'

export default function ProfileExperiencePage() {
  return (
    <DashboardLayout
      leftContent={<ProfileExperienceLeft />}
      rightContent={<ProfileExperienceRight />}
    />
  )
}
