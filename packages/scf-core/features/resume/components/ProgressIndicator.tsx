import { Button, Text, Row, Stack, useThemeContext } from "@scaffald/ui";
import { colors } from "@scaffald/ui/tokens";

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
  const { theme } = useThemeContext();
  const t = theme === "dark" ? "dark" : "light";
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
                  isCompleted ? (t === "light" ? colors.success[100] : colors.success[900]) : isActive ? (t === "light" ? colors.info[100] : colors.info[900]) : colors.bg[t].muted
                }
                align="center"
                justify="center"
              >
                <Text style={{ color: colors.text[t].secondary }}>{index + 1}</Text>
              </Stack>
              <Stack>
                <Text>{step.label}</Text>
                <Text style={{ color: colors.text[t].secondary }}>
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
