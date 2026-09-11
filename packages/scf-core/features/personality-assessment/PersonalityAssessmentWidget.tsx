import { ROUTES } from "@scf/core/constants/routes";
import { useAssessmentStatus } from "@scf/core/utils/personality-assessment-sdk-hooks";
import {
  Button,
  DashboardWidget,
  spacing,
  useThemeContext,
} from "@scaffald/ui";
import { colors } from "@scaffald/ui/tokens";
import { useRouter } from "expo-router";
import { ProgressBar, Spinner, Text, Row, Stack } from "@scaffald/ui";

/**
 * PersonalityAssessmentWidget - Dashboard widget for personality assessment
 *
 * Displays:
 * - Completion status and progress
 * - "Start Assessment" or "Continue Assessment" button
 * - Links to assessment wizard
 */
export function PersonalityAssessmentWidget() {
  const { theme } = useThemeContext();
  const router = useRouter();

  // Get assessment status
  const { data: assessmentData, isLoading } = useAssessmentStatus();
  // getStatus() returns the status object itself; the `{ data }` this used to
  // reach through was never sent, so this read undefined (#744).
  const assessment = assessmentData;

  // Don't show widget if already completed
  if (isLoading) {
    return (
      <DashboardWidget>
        <Stack gap={spacing[8]} align="center" style={{ paddingVertical: 40 }}>
          <Spinner variant="ios" size="lg" />
          <Text style={{ color: colors.text[theme].secondary }}>
            Loading...
          </Text>
        </Stack>
      </DashboardWidget>
    );
  }

  // Hide widget if assessment is complete
  if (
    assessment?.current_step === "completed" ||
    assessment?.completion_score === 100
  ) {
    return null;
  }

  const completionScore = assessment?.completion_score || 0;
  const hasStarted = completionScore > 0;
  const currentStep = assessment?.current_step || "luscher1";

  const getStepLabel = (step: string) => {
    switch (step) {
      case "luscher1":
        return "Color Test 1";
      case "ipip":
        return "Personality Questions";
      case "luscher2":
        return "Color Test 2";
      case "acute":
        return "Results";
      default:
        return "Assessment";
    }
  };

  const handleStart = () => {
    router.push(ROUTES.ASSESSMENTS.IPIP.path);
  };

  return (
    <DashboardWidget>
      <Stack gap={spacing[16]}>
        <Stack gap={spacing[4]}>
          <Text style={{ color: colors.text[theme].secondary }}>
            Personality Assessment
          </Text>
          <Text style={{ color: colors.text[theme].secondary }}>
            Discover your personality traits through a comprehensive assessment
            including color psychology and personality questions.
          </Text>
        </Stack>

        {/* Progress Display */}
        {hasStarted && (
          <Stack gap={spacing[4]}>
            <Row justify="space-between" align="center">
              <Text style={{ color: colors.text[theme].secondary }}>
                {getStepLabel(currentStep)}
              </Text>
              <Text
                style={{
                  color:
                    theme === "light" ? colors.blue[700] : colors.blue[300],
                }}
              >
                {completionScore}%
              </Text>
            </Row>
            <ProgressBar
              value={completionScore}
              showLabel={false}
              showIndicator={false}
              showHintMessage={false}
            />
            <Text style={{ color: colors.text[theme].secondary }}>
              {hasStarted
                ? "Continue where you left off"
                : "Start your assessment"}
            </Text>
          </Stack>
        )}

        {/* Action Button */}
        <Button
          variant="filled"
          color="primary"
          onPress={handleStart}
          size="lg"
          style={{ marginTop: hasStarted ? spacing[4] : spacing[16] }}
        >
          {hasStarted ? "Continue Assessment" : "Start Assessment"}
        </Button>

        {!hasStarted && (
          <Text style={{ color: colors.text[theme].secondary }}>
            This assessment takes about 10-15 minutes and includes color tests
            and 120 personality questions.
          </Text>
        )}
      </Stack>
    </DashboardWidget>
  );
}
