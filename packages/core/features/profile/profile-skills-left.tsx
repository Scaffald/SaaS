import { YStack, Text, H3, ScrollView } from 'tamagui'

/**
 * Profile Skills Left Component
 * Navigation and overview for skills profile settings
 */
export function ProfileSkillsLeft() {
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <YStack gap="$4" padding="$4">
        <H3>Skills & Expertise</H3>
        <Text color="$gray11" fontSize="$3">
          Showcase your skills and expertise with proficiency levels. Add endorsements and highlight
          your strongest areas.
        </Text>
      </YStack>
    </ScrollView>
  )
}
