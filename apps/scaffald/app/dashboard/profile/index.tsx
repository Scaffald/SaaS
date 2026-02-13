import { ROUTES } from '@scf/core/constants/routes'
import { IdVerificationWidget } from '@scf/core/features/id-verification'
import { ProfilePage } from '@scf/core/features/profile/ProfilePage'
import { ProfileCertificationsHighlightProvider } from '@scf/core/features/profile/profile-certifications-highlight-context'
import { ProfileCertificationsRight } from '@scf/core/features/profile/profile-certifications-right'
import { ProfileSkillsSection } from '@scf/core/features/profile/components/ProfileSkillsSection'
import {
  EducationWidget,
  ExperienceWidget,
  GeneralInfoWidget,
  PreferencesWidget,
} from '@scf/core/features/profile/widgets'
import { useUser } from '@scf/core/utils/useUser'
import { Stack } from '@scaffald/ui'

/**
 * Profile Index - Own profile view
 * Shows all profile information in a two-column layout with edit buttons
 */
export default function ProfileIndexScreen() {
  const { user } = useUser()

  if (!user) {
    return null
  }

  return (
    <ProfileCertificationsHighlightProvider>
      <ProfilePage
        breadcrumbs={[{ route: ROUTES.DASHBOARD.PROFILE }]}
        leftContent={
          <Stack gap={16}>
            <GeneralInfoWidget userId={user.id} showEdit />
            <ExperienceWidget userId={user.id} showEdit />
            <EducationWidget userId={user.id} showEdit />
          </Stack>
        }
        rightContent={
          <Stack gap={16}>
            <ProfileSkillsSection userId={user.id} showEdit />
            <IdVerificationWidget />
            <ProfileCertificationsRight />
            <PreferencesWidget showEdit />
          </Stack>
        }
      />
    </ProfileCertificationsHighlightProvider>
  )
}
