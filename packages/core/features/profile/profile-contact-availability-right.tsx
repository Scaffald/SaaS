import { YStack, Text } from '@app/ui'

export function ProfileContactAvailabilityRight() {
  return (
    <YStack gap="$5" p="$4" ai="center" jc="center" flex={1}>
      <Text fontSize="$6" fontWeight="600" textAlign="center">
        Hello
      </Text>
      <Text fontSize="$4" color="$color10" textAlign="center">
        Right column placeholder
      </Text>
    </YStack>
  )
}
