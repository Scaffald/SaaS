import { Card, Text, Stack, useThemeContext } from "@scaffald/ui";
import { colors } from "@scaffald/ui/tokens";

interface UserProfileAboutProps {
  bio: string;
}

export function UserProfileAbout({ bio }: UserProfileAboutProps) {
  const { theme } = useThemeContext();
  const t = theme === "dark" ? "dark" : "light";
  return (
    <Card elevate bordered>
      <Stack gap={12} padding="lg">
        <Text style={{ color: colors.text[t].secondary }}>About</Text>
        <Text style={{ color: colors.text[t].secondary, lineHeight: 24 }}>
          {bio}
        </Text>
      </Stack>
    </Card>
  );
}
