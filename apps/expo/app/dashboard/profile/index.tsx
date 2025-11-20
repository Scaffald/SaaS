import { YStack } from 'tamagui'
import { DashboardLayout, QuickLinksSidebar } from '@app/ui'
import {
  GeneralInfoWidget,
  ExperienceWidget,
  EducationWidget,
  SkillsWidget,
  PreferencesWidget,
} from '@app/core/features/profile/widgets'
import { ProfileCertificationsRight } from '@app/core/features/profile/profile-certifications-right'
import { ProfileCertificationsHighlightProvider } from '@app/core/features/profile/profile-certifications-highlight-context'
import { useUser } from '@app/core/utils/useUser'
import { IdVerificationWidget } from '@app/core/features/id-verification'
import { AccountDeletionPanel } from '@app/core/features/profile/components/AccountDeletionPanel'

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
      <DashboardLayout
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
