import { ProfileSkillsLeft, ProfileSkillsProvider } from '@scf/core/features/profile'
import { EmploymentSection, GeneralProfileSection } from '@scf/core/features/profile/components'
import { ProfileCertificationsHighlightProvider } from '@scf/core/features/profile/profile-certifications-highlight-context'
import { ProfileCertificationsLeft } from '@scf/core/features/profile/profile-certifications-left'
import { ProfileEducationLeft } from '@scf/core/features/profile/profile-education-left'
import { ProfileExperienceLeft } from '@scf/core/features/profile/profile-experience-left'
import { Button, H2, Separator, Text, Row, Stack, Card } from '@unicornlove/beyond-ui'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ScrollView } from 'react-native'

export default function EditUserPage() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()

  if (!id) {
    return (
      <Stack flex={1} alignItems="center" justifyContent="center">
        <Text>Invalid user ID</Text>
      </Stack>
    )
  }

  return (
    <ScrollView flex={1} backgroundColor="$background">
      <Stack padding="$4" gap="$4">
        {/* Header */}
        <Stack gap="$3">
          <Row alignItems="center" justifyContent="space-between">
            <H2>Edit User Profile</H2>
            <Button onPress={() => router.back()} variant="outlined">Back to Users</Button>
          </Row>
          <Text color="$color11" fontSize="$3">
            Comprehensive user profile management with all profile sections.
          </Text>
          <Separator />
        </Stack>

        {/* General Profile Section */}
        <Stack gap="$2">
          <Text fontSize="$6" fontWeight="600">
            General Information
          </Text>
          <GeneralProfileSection userId={id} mode="admin" />
        </Stack>

        {/* Employment Section */}
        <Stack gap="$2">
          <Text fontSize="$6" fontWeight="600">
            Employment Preferences
          </Text>
          <EmploymentSection userId={id} mode="admin" />
        </Stack>

        {/* Skills Section - Note: Currently operates on current admin user */}
        <Stack gap="$2">
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
        </Stack>

        {/* Experience Section - Note: Currently operates on current admin user */}
        <Stack gap="$2">
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
        </Stack>

        {/* Education Section - Note: Currently operates on current admin user */}
        <Stack gap="$2">
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
        </Stack>

        {/* Certifications Section - Note: Currently operates on current admin user */}
        <Stack gap="$2">
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
        </Stack>
      </Stack>
    </ScrollView>
  )
}
