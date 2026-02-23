import { ROUTES } from "@scf/core/constants/routes";
import { useRIASECStatus } from "@scf/core/utils/onet-sdk-hooks";
import { Button, DashboardWidget, useThemeContext } from "@scaffald/ui";
import { useRouter } from "expo-router";
import { Spinner, Text, Stack } from "@scaffald/ui";

/**
 * RIASECAssessmentWidget - Dashboard widget CTA for RIASEC Career Interests
 */
export function RIASECAssessmentWidget() {
  useThemeContext();
  const router = useRouter();

  const { data: status, isLoading } = useRIASECStatus();

  if (isLoading) {
    return (
      <DashboardWidget>
        <Stack gap={10} align="center" paddingVertical={40}>
          <Spinner size="lg" color="primary" />
          <Text color="$gray11">Loading...</Text>
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
        <Stack gap={8}>
          <Text color="$gray11">Career Interests</Text>
          <Text color="$gray11">
            Rate your interest in 6 career dimensions to discover careers that
            match your interests.
          </Text>
        </Stack>

        <Button
          variant="filled"
          color="primary"
          onPress={handleStart}
          size="lg"
        >
          Start Interest Assessment
        </Button>

        <Text color="$gray11">Takes about 2-3 minutes</Text>
      </Stack>
    </DashboardWidget>
  );
}
