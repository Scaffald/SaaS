import { YStack, Text, H3, ScrollView } from 'tamagui'

/**
 * Profile Certifications Left Component
 * Navigation and overview for certifications profile settings
 */
export function ProfileCertificationsLeft() {
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <YStack gap="$4" p="$4">
        <H3>Certifications</H3>
        <Text color="$color11" fontSize="$3">
          Add your professional certifications, licenses, and credentials. Include verification
          details and expiration dates.
        </Text>
      </YStack>
    </ScrollView>
  )
}
