import { YStack, Text, H3, ScrollView } from 'tamagui'

/**
 * Profile Employment Right Component
 * Navigation and overview for employment profile settings
 */
export function ProfileEmploymentRight() {
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <YStack gap="$4" padding="$4">
        <H3>Employment Information</H3>
        <Text color="$gray11" fontSize="$3">
          Update your employment preferences including location, travel willingness, availability,
          and compensation.
        </Text>
      </YStack>
    </ScrollView>
  )
}
