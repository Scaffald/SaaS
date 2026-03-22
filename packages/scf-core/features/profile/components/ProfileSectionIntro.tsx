import { DashboardWidget, H3, Text, useThemeContext } from "@scaffald/ui";
import { colors } from "@scaffald/ui/tokens";

export interface ProfileSectionIntroProps {
  title: string;
  description: string;
}

/**
 * Intro widget for profile section pages: title + description in a DashboardWidget.
 * Matches the style used on /profile/general.
 */
export function ProfileSectionIntro({ title, description }: ProfileSectionIntroProps) {
  const { theme } = useThemeContext();
  return (
    <DashboardWidget>
      <H3>{title}</H3>
      <Text style={{ color: colors.text[theme].secondary }}>{description}</Text>
    </DashboardWidget>
  );
}
