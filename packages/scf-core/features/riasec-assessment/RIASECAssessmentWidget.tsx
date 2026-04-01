import { ROUTES } from "@scf/core/constants/routes";
import { useRIASECStatus } from "@scf/core/utils/onet-sdk-hooks";
import { Button, DashboardWidget, useThemeContext } from "@scaffald/ui";
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
    router.push(ROUTES.ASSESSMENTS.RIASEC.path);
  };

  const labelStyle = {
    fontSize: 10,
    fontWeight: '800' as const,
    color: colors.text[theme].tertiary,
    textTransform: 'uppercase' as const,
    letterSpacing: 1.5,
  }

  const metaStyle = {
    fontSize: 11,
    fontWeight: '600' as const,
    color: colors.text[theme].tertiary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  }

  return (
    <DashboardWidget>
      <Stack gap={12}>
        <Stack gap={4}>
          <Text style={labelStyle}>Career Interests</Text>
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text[theme].primary }}>
            Career Interests
          </Text>
        </Stack>
        <Text style={{ color: colors.text[theme].secondary }}>
          Rate your interest in 6 career dimensions to discover careers that
          match your interests.
        </Text>

        <Button variant="outline" color="gray" size="sm" fullWidth onPress={handleStart}>
          Start Interest Assessment
        </Button>

        <Text style={metaStyle}>Takes about 2-3 minutes</Text>
      </Stack>
    </DashboardWidget>
  );
}
