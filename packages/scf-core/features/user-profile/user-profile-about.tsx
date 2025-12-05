import { Card, Text, YStack } from '@unicornlove/ui'

interface UserProfileAboutProps {
  bio: string
}

export function UserProfileAbout({ bio }: UserProfileAboutProps) {
  return (
    <Card elevate bordered>
      <YStack gap="$3" padding="$5">
        <Text fontSize="$7" fontWeight="700" color="$color12">
          About
        </Text>
        <Text fontSize="$5" color="$color11" lineHeight={24}>
          {bio}
        </Text>
      </YStack>
    </Card>
  )
}
