import { Card, Text, Stack } from '@unicornlove/beyond-ui'

interface UserProfileAboutProps {
  bio: string
}

export function UserProfileAbout({ bio }: UserProfileAboutProps) {
  return (
    <Card elevate bordered>
      <Stack gap={12} padding="lg">
        <Text color="$gray11">About</Text>
        <Text color="$gray11" lineHeight={24}>
          {bio}
        </Text>
      </Stack>
    </Card>
  )
}
