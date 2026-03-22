import { ROUTES } from "@scf/core/constants/routes";
import { useRIASECStatus } from "@scf/core/utils/onet-sdk-hooks";
import { Button, DashboardWidget, DashboardWidgetHeader, useThemeContext } from "@scaffald/ui";
import { colors } from "@scaffald/ui/tokens";
import { useRouter } from "expo-router";
import { Spinner, Text, Stack } from "@scaffald/ui";

/**
 * RIASECAssessmentWidget - Dashboard widget CTA for RIASEC Career Interests
 */
export function RIASECAssessmentWidget() {
  const { theme } = useThemeContext();
  const router = useRouter();

  const { data: status, isLoading } = useRIASECStatus();

  if (isLoading) {
    return (
      <DashboardWidget>
        <Stack gap={10} align="center" paddingVertical={40}>
          <Spinner variant="ios" size="lg" color="primary" />
          <Text style={{ color: colors.text[theme].secondary }}>Loading...</Text>
        </Stack>
      </DashboardWidget>
    );
  }

  if (status?.isCompleted) {
    return null;
  }

  const handleStart = () => {
    router.push(ROUTES.DASHBOARD.ASSESSMENTS.RIASEC.path);
  };

  return (
    <DashboardWidget>
      <Stack gap={12}>
        <DashboardWidgetHeader title="Career Interests" />
        <Text style={{ color: colors.text[theme].secondary }}>
          Rate your interest in 6 career dimensions to discover careers that
          match your interests.
        </Text>

        <Button
          variant="filled"
          color="primary"
          onPress={handleStart}
          size="lg"
        >
          Start Interest Assessment
        </Button>

        <Text style={{ color: colors.text[theme].secondary }}>Takes about 2-3 minutes</Text>
      </Stack>
    </DashboardWidget>
  );
}
