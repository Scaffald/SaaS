import { YStack, Text, H3, ScrollView } from 'tamagui'

/**
 * Profile Experience Left Component
 * Navigation and overview for experience profile settings
 */
export function ProfileExperienceLeft() {
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <YStack gap="$4" p="$4">
        <H3>Work Experience</H3>
        <Text color="$color11" fontSize="$3">
          Add your work history, achievements, and professional experience. Include job
          responsibilities and key accomplishments.
        </Text>
      </YStack>
    </ScrollView>
  )
}
