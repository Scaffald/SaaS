import { ProfileSkillsLeft, ProfileSkillsProvider } from '@app/core/features/profile'
import { EmploymentSection, GeneralProfileSection } from '@app/core/features/profile/components'
import { ProfileCertificationsHighlightProvider } from '@app/core/features/profile/profile-certifications-highlight-context'
import { ProfileCertificationsLeft } from '@app/core/features/profile/profile-certifications-left'
import { ProfileEducationLeft } from '@app/core/features/profile/profile-education-left'
import { ProfileExperienceLeft } from '@app/core/features/profile/profile-experience-left'
import { Button, H2, ScrollView, Separator, Text, XStack, YStack } from '@unicornlove/ui'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Card } from '@unicornlove/ui'

export default function EditUserPage() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()

  if (!id) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center">
        <Text>Invalid user ID</Text>
      </YStack>
    )
  }

  return (
    <ScrollView flex={1} backgroundColor="$background">
      <YStack padding="$4" gap="$4">
        {/* Header */}
        <YStack gap="$3">
          <XStack alignItems="center" justifyContent="space-between">
            <H2>Edit User Profile</H2>
            <Button onPress={() => router.back()} variant="outlined">
              Back to Users
            </Button>
          </XStack>
          <Text color="$color11" fontSize="$3">
            Comprehensive user profile management with all profile sections.
          </Text>
          <Separator />
        </YStack>

        {/* General Profile Section */}
        <YStack gap="$2">
          <Text fontSize="$6" fontWeight="600">
            General Information
          </Text>
          <GeneralProfileSection userId={id} mode="admin" />
        </YStack>

        {/* Employment Section */}
        <YStack gap="$2">
          <Text fontSize="$6" fontWeight="600">
            Employment Preferences
          </Text>
          <EmploymentSection userId={id} mode="admin" />
        </YStack>

        {/* Skills Section - Note: Currently operates on current admin user */}
        <YStack gap="$2">
          <Text fontSize="$6" fontWeight="600">
            Skills & Expertise
          </Text>
          <Card bordered backgroundColor="$yellow2" padding="$3" marginBottom="$2">
            <Text fontSize="$2" color="$yellow11">
              ⚠️ Note: Skills section currently shows/edits the logged-in admin's skills. Full
              multi-user support coming soon.
            </Text>
          </Card>
          <ProfileSkillsProvider>
            <ProfileSkillsLeft />
          </ProfileSkillsProvider>
        </YStack>

        {/* Experience Section - Note: Currently operates on current admin user */}
        <YStack gap="$2">
          <Text fontSize="$6" fontWeight="600">
            Work Experience
          </Text>
          <Card bordered backgroundColor="$yellow2" padding="$3" marginBottom="$2">
            <Text fontSize="$2" color="$yellow11">
              ⚠️ Note: Experience section currently shows/edits the logged-in admin's experience.
              Full multi-user support coming soon.
            </Text>
          </Card>
          <ProfileExperienceLeft />
        </YStack>

        {/* Education Section - Note: Currently operates on current admin user */}
        <YStack gap="$2">
          <Text fontSize="$6" fontWeight="600">
            Education
          </Text>
          <Card bordered backgroundColor="$yellow2" padding="$3" marginBottom="$2">
            <Text fontSize="$2" color="$yellow11">
              ⚠️ Note: Education section currently shows/edits the logged-in admin's education. Full
              multi-user support coming soon.
            </Text>
          </Card>
          <ProfileEducationLeft />
        </YStack>

        {/* Certifications Section - Note: Currently operates on current admin user */}
        <YStack gap="$2">
          <Text fontSize="$6" fontWeight="600">
            Certifications
          </Text>
          <Card bordered backgroundColor="$yellow2" padding="$3" marginBottom="$2">
            <Text fontSize="$2" color="$yellow11">
              ⚠️ Note: Certifications section currently shows/edits the logged-in admin's
              certifications. Full multi-user support coming soon.
            </Text>
          </Card>
          <ProfileCertificationsHighlightProvider>
            <ProfileCertificationsLeft />
          </ProfileCertificationsHighlightProvider>
        </YStack>
      </YStack>
    </ScrollView>
  )
}
