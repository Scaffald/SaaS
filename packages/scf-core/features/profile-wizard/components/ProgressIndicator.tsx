import { memo, useMemo } from "react";
import { ProgressBar, Separator, Text, Row, Stack } from "@scaffald/ui";
import type { ProfileWizardStepId } from "../utils/wizardSteps";
import {
  PROFILE_WIZARD_STEP_META,
  PROFILE_WIZARD_STEPS,
} from "../utils/wizardSteps";

export interface WizardProgressIndicatorProps {
  currentStep: ProfileWizardStepId;
  completedSteps: ProfileWizardStepId[];
  completionPercentage: number;
  showStepLabels?: boolean;
}

export const ProgressIndicator = memo(function ProgressIndicator({
  currentStep,
  completedSteps,
  completionPercentage,
  showStepLabels = true,
}: WizardProgressIndicatorProps) {
  const orderedSteps = useMemo(() => PROFILE_WIZARD_STEPS, []);

  return (
    <Stack gap={12} aria-live="polite">
      <Row justify="space-between" align="center">
        <Text>
          Step {orderedSteps.indexOf(currentStep) + 1} of {orderedSteps.length}
        </Text>
        <Text style={{ color: "#414e62" }}>{completionPercentage}%</Text>
      </Row>

      <ProgressBar
        value={completionPercentage}
        showLabel={false}
        showIndicator={false}
        showHintMessage={false}
      />

      {showStepLabels && (
        <Row gap={12} align="flex-start" style={{ marginTop: 8 }} wrap>
          {orderedSteps.map((stepId, index) => {
            const meta = PROFILE_WIZARD_STEP_META[stepId];
            const isCompleted = completedSteps.includes(stepId);
            const isCurrent = currentStep === stepId;

            return (
              <Row key={stepId} gap={8} align="center">
                <Stack
                  width={32}
                  height={32}
                  backgroundColor={
                    isCurrent ? "#2563eb" : isCompleted ? "#16a34a" : "#ced2da"
                  }
                  align="center"
                  justify="center"
                  borderRadius={12}
                  role="img"
                  aria-label={`${meta.title} ${
                    isCurrent
                      ? "(current step)"
                      : isCompleted
                      ? "(completed)"
                      : "(not completed)"
                  }`}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  <Text style={{ color: "#414e62" }}>{index + 1}</Text>
                </Stack>
                <Stack style={{ maxWidth: 160 }}>
                  <Text style={{ color: "#414e62" }}>{meta.title}</Text>
                  <Text style={{ color: "#414e62" }}>
                    {meta.estimatedTimeMinutes} min
                  </Text>
                </Stack>
                {index < orderedSteps.length - 1 && (
                  <Separator orientation="vertical" />
                )}
              </Row>
            );
          })}
        </Row>
      )}
    </Stack>
  );
});
