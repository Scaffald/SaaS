import { Trophy } from "lucide-react-native";
import { memo } from "react";
import { Text, Row, Stack, useThemeContext } from "@scaffald/ui";
import { colors } from "@scaffald/ui/tokens";
import type { CompletionMilestone } from "../hooks/useCompletionStatus";

interface MilestoneBadgeProps {
  milestone: CompletionMilestone;
}

export const MilestoneBadge = memo(function MilestoneBadge({
  milestone,
}: MilestoneBadgeProps) {
  const { theme } = useThemeContext();
  const t = theme === "dark" ? "dark" : "light";

  return (
    <Row
      gap={8}
      align="center"
      paddingHorizontal={12}
      paddingVertical={8}
      style={{
        backgroundColor: milestone.achieved
          ? (t === "dark" ? colors.green[900] : colors.green[50])
          : colors.bg[t].muted,
        borderColor: milestone.achieved
          ? (t === "dark" ? colors.green[700] : colors.green[300])
          : colors.border[t].default,
        borderWidth: 1,
        borderRadius: 12,
        opacity: milestone.achieved ? 1 : 0.7,
      }}
    >
      <Trophy
        size="md"
        color={milestone.achieved
          ? (t === "dark" ? colors.green[300] : colors.green[600])
          : colors.text[t].primary}
        data-testid="trophy-icon"
      />
      <Stack>
        <Text
          style={{
            color: milestone.achieved
              ? (t === "dark" ? colors.green[300] : colors.green[700])
              : colors.text[t].primary,
          }}
        >
          {milestone.label}
        </Text>
        <Text style={{ color: colors.text[t].secondary }}>
          {milestone.threshold}% milestone
        </Text>
      </Stack>
    </Row>
  );
});
