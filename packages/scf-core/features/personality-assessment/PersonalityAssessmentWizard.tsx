import { AlertCircle, ChevronLeft, ChevronRight } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  Button,
  ScrollView,
  Spinner,
  Text,
  Row,
  Stack,
  useThemeContext,
} from "@scaffald/ui";
import { colors } from "@scaffald/ui/tokens";
import { CooldownStep } from "./components/CooldownStep";
import { IPIPTestStep } from "./components/IPIPTestStep";
import { LuscherTestStep } from "./components/LuscherTestStep";
import { ProgressIndicator } from "./components/ProgressIndicator";
import { ResultsStep } from "./components/ResultsStep";
import { usePersonalityAssessment } from "./hooks/usePersonalityAssessment";
import type { IPIPAnswer } from "./lib/ipip";
import type { AssessmentStep } from "./utils/assessment-steps";
import {
  getNextStep,
  getPreviousStep,
  STEP_INFO,
} from "./utils/assessment-steps";

/**
 * PersonalityAssessmentWizard - Multi-step personality assessment container
 *
 * Features:
 * - Step-by-step wizard navigation
 * - Progress indicator with completion percentage
 * - Auto-save functionality
 * - Resume from last step
 */
export function PersonalityAssessmentWizard() {
  const { theme } = useThemeContext();
  const {
    assessment,
    isLoading,
    error,
    currentStep: dbCurrentStep,
    completionScore,
    saveLuscher1,
    saveIPIPProgress,
    saveLuscher2,
    generateReport,
    updateCurrentStep,
  } = usePersonalityAssessment();

  const [currentStep, setCurrentStep] = useState<AssessmentStep>("luscher1");

  // Sync current step with database
  useEffect(() => {
    if (dbCurrentStep && dbCurrentStep !== "completed") {
      setCurrentStep(dbCurrentStep);
    }
  }, [dbCurrentStep]);

  // Loading state
  if (isLoading) {
    return (
      <Stack flex={1} align="center" justify="center" gap={16} padding={32}>
        <Spinner variant="ios" size="lg" />
        <Text style={{ color: colors.text[theme].secondary }}>
          Loading assessment...
        </Text>
      </Stack>
    );
  }

  // Error state
  if (error) {
    return (
      <Stack flex={1} align="center" justify="center" gap={16} padding={32}>
        <AlertCircle
          size={48}
          color={theme === "light" ? colors.error[700] : colors.error[300]}
        />
        <Text
          style={{
            color: theme === "light" ? colors.error[700] : colors.error[300],
          }}
        >
          Error loading assessment
        </Text>
        <Text
          style={{ color: colors.text[theme].secondary, textAlign: "center" }}
        >
          {error.message || "An unexpected error occurred"}
        </Text>
      </Stack>
    );
  }

  const handleNext = () => {
    const next = getNextStep(currentStep);
    if (next) {
      setCurrentStep(next);
    }
  };

  const handlePrevious = () => {
    const previous = getPreviousStep(currentStep);
    if (previous) {
      setCurrentStep(previous);
    }
  };

  const stepInfo = STEP_INFO[currentStep];
  const canGoNext =
    currentStep !== "completed" &&
    currentStep !== "acute" &&
    currentStep !== "cooldown";
  const canGoPrevious =
    currentStep !== "luscher1" && currentStep !== "cooldown";

  return (
    <Stack flex={1} style={{ backgroundColor: colors.bg[theme].default }}>
      {/* Header */}
      <Stack
        padding="md"
        style={{
          backgroundColor: colors.bg[theme].default,
          borderBottomWidth: 1,
          borderBottomColor: colors.border[theme].default,
        }}
        gap={12}
      >
        <Stack gap={4}>
          <Text style={{ color: colors.text[theme].secondary }}>
            Personality Assessment
          </Text>
          <Text style={{ color: colors.text[theme].secondary }}>
            {stepInfo.description}
          </Text>
        </Stack>

        {/* Progress Indicator */}
        <ProgressIndicator
          currentStep={currentStep}
          completionScore={completionScore}
        />
      </Stack>

      {/* Main Content */}
      <ScrollView style={{ flex: 1 }}>
        <Stack padding="md" gap={16}>
          {currentStep === "luscher1" && (
            <LuscherTestStep
              step="luscher1"
              initialChoices={assessment?.luscher1_choices || []}
              onSave={(choices) => {
                saveLuscher1.mutate(
                  { choices },
                  {
                    onSuccess: () => handleNext(),
                  }
                );
              }}
              isLoading={saveLuscher1.isPending}
            />
          )}

          {currentStep === "cooldown" && assessment && (
            <CooldownStep
              cooldownEndTime={
                assessment.cooldown_end_time ||
                new Date(Date.now() + 60 * 1000).toISOString()
              }
              initialAnswers={(assessment?.ipip_answers as IPIPAnswer[]) || []}
              currentIndex={assessment?.ipip_current_index || 0}
              language={assessment?.ipip_language || "en"}
              onSave={(answers, index) => {
                saveIPIPProgress.mutate(
                  {
                    answers,
                    current_index: index,
                    language: assessment?.ipip_language || "en",
                  },
                  {
                    onSuccess: () => {
                      // Don't auto-advance during cooldown
                    },
                  }
                );
              }}
              onCooldownComplete={() => {
                // When cooldown ends, update database and move to IPIP step
                updateCurrentStep.mutate(
                  { step: "ipip" },
                  {
                    onSuccess: () => {
                      handleNext();
                    },
                  }
                );
              }}
              isLoading={saveIPIPProgress.isPending}
            />
          )}

          {currentStep === "ipip" && (
            <IPIPTestStep
              initialAnswers={(assessment?.ipip_answers as IPIPAnswer[]) || []}
              currentIndex={assessment?.ipip_current_index || 0}
              language={assessment?.ipip_language || "en"}
              onSave={(answers, index) => {
                saveIPIPProgress.mutate(
                  {
                    answers,
                    current_index: index,
                    language: assessment?.ipip_language || "en",
                  },
                  {
                    onSuccess: (
                      result: { isComplete?: boolean } | undefined
                    ) => {
                      if (result?.isComplete) {
                        handleNext();
                      }
                    },
                  }
                );
              }}
              isLoading={saveIPIPProgress.isPending}
            />
          )}

          {currentStep === "luscher2" && (
            <LuscherTestStep
              step="luscher2"
              initialChoices={assessment?.luscher2_choices || []}
              onSave={(choices, results) => {
                saveLuscher2.mutate(
                  { choices, results },
                  {
                    onSuccess: () => handleNext(),
                  }
                );
              }}
              isLoading={saveLuscher2.isPending}
            />
          )}

          {currentStep === "acute" && assessment && (
            <ResultsStep
              assessment={
                assessment as Parameters<typeof ResultsStep>[0]["assessment"]
              }
              onGenerateReport={(luscherResults) => {
                generateReport.mutate(
                  { luscherResults },
                  {
                    onSuccess: () => {
                      setCurrentStep("completed");
                    },
                  }
                );
              }}
              isLoading={generateReport.isPending}
            />
          )}

          {currentStep === "completed" && (
            <Stack gap={16} align="center" padding={32}>
              <Text
                style={{
                  color:
                    theme === "light" ? colors.green[700] : colors.green[300],
                }}
              >
                ✓ Assessment Complete!
              </Text>
              <Text
                style={{
                  color: colors.text[theme].secondary,
                  textAlign: "center",
                }}
              >
                Your personality assessment has been completed. You can view
                your results below.
              </Text>
              {assessment && (
                <ResultsStep
                  assessment={
                    assessment as Parameters<
                      typeof ResultsStep
                    >[0]["assessment"]
                  }
                  isReadOnly
                />
              )}
            </Stack>
          )}
        </Stack>
      </ScrollView>

      {/* Navigation Footer */}
      {currentStep !== "completed" && (
        <Stack
          padding="md"
          style={{
            borderTopWidth: 1,
            borderTopColor: colors.border[theme].default,
          }}
        >
          <Row gap={12} justify="space-between">
            <Button
              size="md"
              variant="outline"
              iconStart={ChevronLeft}
              onPress={handlePrevious}
              disabled={!canGoPrevious}
            >
              Previous
            </Button>

            {canGoNext && (
              <Button
                size="md"
                iconEnd={ChevronRight}
                onPress={handleNext}
                disabled={
                  (currentStep === "luscher1" &&
                    (!assessment?.luscher1_choices ||
                      assessment.luscher1_choices.length < 8)) ||
                  (currentStep === "ipip" &&
                    (!assessment?.ipip_answers ||
                      (assessment.ipip_answers as IPIPAnswer[]).length <
                        120)) ||
                  (currentStep === "luscher2" &&
                    (!assessment?.luscher2_choices ||
                      assessment.luscher2_choices.length < 8))
                }
              >
                Next
              </Button>
            )}
          </Row>
        </Stack>
      )}
    </Stack>
  );
}
