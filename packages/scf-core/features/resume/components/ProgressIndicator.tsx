import { Button, Text, Row, Stack } from "@scaffald/ui";

import type { ResumeWizardStep } from "../hooks/useResumeWizard";

interface ProgressIndicatorProps {
  steps: ResumeWizardStep[];
  currentIndex: number;
  completedSteps: number[];
  onStepChange?: (index: number) => void;
}

export function ProgressIndicator({
  steps,
  currentIndex,
  completedSteps,
  onStepChange,
}: ProgressIndicatorProps) {
  return (
    <Row wrap gap={12}>
      {steps.map((step, index) => {
        const isActive = index === currentIndex;
        const isCompleted =
          completedSteps.includes(index) || index < currentIndex;

        return (
          <Button
            key={step.id}
            size="sm"
            variant="outline"
            accessibilityState={{ selected: isActive }}
            onPress={() => onStepChange?.(index)}
          >
            <Row gap={8} align="center">
              <Stack
                width={18}
                height={18}
                borderRadius={9}
                backgroundColor={
                  isCompleted ? "$green4" : isActive ? "$blue4" : "$color4"
                }
                align="center"
                justify="center"
              >
                <Text color="$gray11">{index + 1}</Text>
              </Stack>
              <Stack>
                <Text>{step.label}</Text>
                <Text color="$gray11">
                  {isCompleted
                    ? "Completed"
                    : isActive
                    ? "In Progress"
                    : "Pending"}
                </Text>
              </Stack>
            </Row>
          </Button>
        );
      })}
    </Row>
  );
}
