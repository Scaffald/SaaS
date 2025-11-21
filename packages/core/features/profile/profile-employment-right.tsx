import { Text, YStack } from 'tamagui'

/**
 * Profile Employment Right Component
 * Navigation and overview for employment profile settings
 */
export function ProfileEmploymentRight() {
  return (
    <YStack>
      <YStack gap="$4" p="$4">
        <Text color="$color11" fontSize="$3">
          Update your employment preferences including location, travel willingness, availability,
          and compensation.
        </Text>
      </YStack>
    </YStack>
  )
}
