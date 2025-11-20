import { ROUTES } from '@app/core/constants/routes'
import { IdVerificationWidget } from '@app/core/features/id-verification'
import { ProfilePage } from '@app/core/features/profile/ProfilePage'
import { AccountDeletionPanel } from '@app/core/features/profile/components/AccountDeletionPanel'
import { ProfileCertificationsHighlightProvider } from '@app/core/features/profile/profile-certifications-highlight-context'
import { ProfileCertificationsRight } from '@app/core/features/profile/profile-certifications-right'
import {
  EducationWidget,
  ExperienceWidget,
  GeneralInfoWidget,
  PreferencesWidget,
  SkillsWidget,
} from '@app/core/features/profile/widgets'
import { useUser } from '@app/core/utils/useUser'
import { QuickLinksSidebar } from '@app/ui'
import { YStack } from 'tamagui'

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
          <YStack gap="$4">
            <GeneralInfoWidget userId={user.id} showEdit />
            <ExperienceWidget userId={user.id} showEdit />
            <EducationWidget userId={user.id} showEdit />
          </YStack>
        }
        rightContent={
          <QuickLinksSidebar>
            <YStack gap="$4">
              <SkillsWidget userId={user.id} showEdit />
              <IdVerificationWidget />
              <ProfileCertificationsRight />
              <PreferencesWidget showEdit />
              <AccountDeletionPanel />
            </YStack>
          </QuickLinksSidebar>
        }
      />
    </ProfileCertificationsHighlightProvider>
  )
}
