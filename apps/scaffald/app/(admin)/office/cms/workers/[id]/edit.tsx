import { colors } from '@scaffald/ui/tokens'
import { ProfileSkillsLeft, ProfileSkillsProvider } from '@scf/core/features/profile'
import { EmploymentSection, GeneralProfileSection } from '@scf/core/features/profile/components'
import { ProfileCertificationsHighlightProvider } from '@scf/core/features/profile/profile-certifications-highlight-context'
import { ProfileCertificationsLeft } from '@scf/core/features/profile/profile-certifications-left'
import { ProfileEducationLeft } from '@scf/core/features/profile/profile-education-left'
import { ProfileExperienceLeft } from '@scf/core/features/profile/profile-experience-left'
import { Button, H2, Separator, Text, Row, Stack, Card, useThemeContext } from '@scaffald/ui'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ScrollView } from 'react-native'

export default function EditUserPage() {
  const { theme } = useThemeContext()
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()

  if (!id) {
    return (
      <Stack align="center" justify="center">
        <Text>Invalid user ID</Text>
      </Stack>
    )
  }

  return (
    <ScrollView>
      <Stack padding={16} gap={16}>
        {/* Header */}
        <Stack gap={12}>
          <Row align="center" justify="space-between">
            <H2>Edit User Profile</H2>
            <Button onPress={() => router.back()} variant="outline">
              Back to Users
            </Button>
          </Row>
          <Text color="gray">Comprehensive user profile management with all profile sections.</Text>
          <Separator />
        </Stack>

        {/* General Profile Section */}
        <Stack gap={8}>
          <Text>General Information</Text>
          <GeneralProfileSection userId={id} mode="admin" />
        </Stack>

        {/* Employment Section */}
        <Stack gap={8}>
          <Text>Employment Preferences</Text>
          <EmploymentSection userId={id} mode="admin" />
        </Stack>

        {/* Skills Section - Note: Currently operates on current admin user */}
        <Stack gap={8}>
          <Text>Skills & Expertise</Text>
          <Card bordered padding="sm">
            <Text style={{ color: colors.text[theme].attention }}>
              ⚠️ Note: Skills section currently shows/edits the logged-in admin's skills. Full
              multi-user support coming soon.
            </Text>
          </Card>
          <ProfileSkillsProvider>
            <ProfileSkillsLeft />
          </ProfileSkillsProvider>
        </Stack>

        {/* Experience Section - Note: Currently operates on current admin user */}
        <Stack gap={8}>
          <Text>Work Experience</Text>
          <Card bordered padding="sm">
            <Text style={{ color: colors.text[theme].attention }}>
              ⚠️ Note: Experience section currently shows/edits the logged-in admin's experience.
              Full multi-user support coming soon.
            </Text>
          </Card>
          <ProfileExperienceLeft />
        </Stack>

        {/* Education Section - Note: Currently operates on current admin user */}
        <Stack gap={8}>
          <Text>Education</Text>
          <Card bordered padding="sm">
            <Text style={{ color: colors.text[theme].attention }}>
              ⚠️ Note: Education section currently shows/edits the logged-in admin's education. Full
              multi-user support coming soon.
            </Text>
          </Card>
          <ProfileEducationLeft />
        </Stack>

        {/* Certifications Section - Note: Currently operates on current admin user */}
        <Stack gap={8}>
          <Text>Certifications</Text>
          <Card bordered padding="sm">
            <Text style={{ color: colors.text[theme].attention }}>
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
