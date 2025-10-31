import { useLocalSearchParams } from 'expo-router'
import { YStack } from 'tamagui'
import { DashboardLayout } from '@app/ui'
import {
  GeneralInfoWidget,
  ExperienceWidget,
  EducationWidget,
  SkillsWidget,
  CertificationsWidget,
  ReviewsWidget,
} from '@app/core/features/profile/widgets'

/**
 * Dynamic User Profile Route
 * Shows comprehensive profile view for any user
 * Uses same widgets as own profile but with showEdit={false}
 */
export default function UserProfilePage() {
  const { id } = useLocalSearchParams<{ id: string }>()

  if (!id) {
    return null
  }

  return (
    <DashboardLayout
      leftContent={
        <YStack gap="$4">
          <GeneralInfoWidget userId={id} showEdit={false} />
          <ExperienceWidget userId={id} showEdit={false} />
          <EducationWidget userId={id} showEdit={false} />
        </YStack>
      }
      rightContent={
        <YStack gap="$4">
          <SkillsWidget userId={id} showEdit={false} />
          <CertificationsWidget userId={id} showEdit={false} />
          <ReviewsWidget userId={id} showEdit={true} />
        </YStack>
      }
    />
  )
}
