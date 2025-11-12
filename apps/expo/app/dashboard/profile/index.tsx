import { YStack } from 'tamagui'
import { DashboardLayout, QuickLinksSidebar } from '@app/ui'
import {
  GeneralInfoWidget,
  ExperienceWidget,
  EducationWidget,
  SkillsWidget,
  CertificationsWidget,
  PreferencesWidget,
} from '@app/core/features/profile/widgets'
import { useUser } from '@app/core/utils/useUser'

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
            <CertificationsWidget userId={user.id} showEdit />
            <PreferencesWidget showEdit />
          </YStack>
        </QuickLinksSidebar>
      }
    />
  )
}
