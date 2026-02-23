import { Card, Text, Stack } from "@scaffald/ui";

interface UserProfileAboutProps {
  bio: string;
}

export function UserProfileAbout({ bio }: UserProfileAboutProps) {
  return (
    <Card elevate bordered>
      <Stack gap={12} padding="lg">
        <Text color="$gray11">About</Text>
        <Text color="$gray11" style={{ lineHeight: 24 }}>
          {bio}
        </Text>
      </Stack>
    </Card>
  );
}
