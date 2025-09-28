import { YStack, Text, H3 } from 'tamagui'

/**
 * Profile General Right Component
 * Navigation and overview for general profile settings
 */
export function ProfileGeneralRight() {
  return (
    <>
      <YStack space="$4" padding="$4">
        <H3>General Information</H3>
        <Text color="$gray11" fontSize="$3">
          Update your basic profile information including your name, photo, and contact details.
        </Text>
      </YStack>

      {/* Profile Stats Information */}
      <YStack
        space="$3"
        padding="$4"
        backgroundColor="$blue2"
        borderRadius="$4"
        borderWidth={1}
        borderColor="$blue6"
      >
        <Text fontWeight="600" color="$blue11" fontSize="$4">
          📊 Profile Completion Benefits
        </Text>
        <YStack space="$2">
          <Text color="$blue10" fontSize="$3">
            • Accurate and complete profile data leads to faster onboarding
          </Text>
          <Text color="$blue10" fontSize="$3">
            • Complete profiles receive 3x more opportunities
          </Text>
          <Text color="$blue10" fontSize="$3">
            • Verified information builds trust with potential partners
          </Text>
          <Text color="$blue10" fontSize="$3">
            • Professional profiles are prioritized in search results
          </Text>
        </YStack>
      </YStack>
    </>
  )
}
