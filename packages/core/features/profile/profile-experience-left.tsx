import { YStack, Text, H3 } from 'tamagui'

/**
 * Profile Experience Left Component
 * Navigation and overview for experience profile settings
 */
export function ProfileExperienceLeft() {
  return (
    <YStack space="$4" padding="$4">
      <H3>Work Experience</H3>
      <Text color="$gray11" fontSize="$3">
        Add your work history, achievements, and professional experience. Include job
        responsibilities and key accomplishments.
      </Text>
    </YStack>
  )
}
