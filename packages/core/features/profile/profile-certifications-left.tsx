import { YStack, Text, H3 } from 'tamagui'

/**
 * Profile Certifications Left Component
 * Navigation and overview for certifications profile settings
 */
export function ProfileCertificationsLeft() {
  return (
    <YStack gap="$4" padding="$4">
      <H3>Certifications</H3>
      <Text color="$gray11" fontSize="$3">
        Add your professional certifications, licenses, and credentials. Include verification
        details and expiration dates.
      </Text>
    </YStack>
  )
}
