import { YStack, Text, H3, ScrollView } from 'tamagui'

/**
 * Profile Education Left Component
 * Navigation and overview for education profile settings
 */
export function ProfileEducationLeft() {
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <YStack gap="$4" padding="$4">
        <H3>Education</H3>
        <Text color="$gray11" fontSize="$3">
          Add your educational background including degrees, certifications, and academic
          achievements.
        </Text>
      </YStack>
    </ScrollView>
  )
}
