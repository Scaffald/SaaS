import { ROUTES } from '@scf/core/constants/routes'
import { ExperienceEditProvider } from '@scf/core/features/profile/contexts/experience-edit-context'
import { ProfilePage } from '@scf/core/features/profile/ProfilePage'
import { ProfileExperienceLeft } from '@scf/core/features/profile/profile-experience-left'
import { ProfileExperienceRight } from '@scf/core/features/profile/profile-experience-right'

export default function ProfileExperiencePage() {
  return (
    <ExperienceEditProvider>
      <ProfilePage
        breadcrumbs={[
          { route: ROUTES.DASHBOARD.PROFILE },
          { route: ROUTES.DASHBOARD.PROFILE.EXPERIENCE },
        ]}
        leftContent={<ProfileExperienceLeft />}
        rightContent={<ProfileExperienceRight />}
      />
    </ExperienceEditProvider>
  )
}
