import { Card, Text, Stack } from '@unicornlove/beyond-ui'

interface UserProfileAboutProps {
  bio: string
}

export function UserProfileAbout({ bio }: UserProfileAboutProps) {
  return (
    <Card elevate bordered>
      <Stack gap={12} padding={20}>
        <Text color="gray">About</Text>
        <Text color="gray" lineHeight={24}>
          {bio}
        </Text>
      </Stack>
    </Card>
  )
}
