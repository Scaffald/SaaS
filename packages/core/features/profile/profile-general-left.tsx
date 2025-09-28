import { YStack, Text, H3 } from 'tamagui'

/**
 * Profile General Left Component
 * Navigation and overview for general profile settings
 */
export function ProfileGeneralLeft() {
  return (
    <YStack space="$4" padding="$4">
      <H3>General Information</H3>
      <Text color="$gray11" fontSize="$3">
        Update your basic profile information including your name, photo, and contact details.
      </Text>
    </YStack>
  )
}
