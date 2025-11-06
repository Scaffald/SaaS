export type AssessmentStep =
  | "luscher1"
  | "cooldown"
  | "ipip"
  | "luscher2"
  | "acute"
  | "completed";

export const ASSESSMENT_STEPS: AssessmentStep[] = [
  "luscher1",
  "cooldown",
  "ipip",
  "luscher2",
  "acute",
  "completed",
];

export interface StepInfo {
  id: AssessmentStep;
  label: string;
  description: string;
  order: number;
}

export const STEP_INFO: Record<AssessmentStep, StepInfo> = {
  luscher1: {
    id: "luscher1",
    label: "Color Test 1",
    description: "Select 8 colors in order of preference",
    order: 1,
  },
  cooldown: {
    id: "cooldown",
    label: "Cooldown Period",
    description: "Please wait 60 seconds before the next color test",
    order: 2,
  },
  ipip: {
    id: "ipip",
    label: "Personality Questions",
    description: "Answer 120 personality questions",
    order: 3,
  },
  luscher2: {
    id: "luscher2",
    label: "Color Test 2",
    description: "Select 8 colors again (aspirational)",
    order: 4,
  },
  acute: {
    id: "acute",
    label: "Results",
    description: "View your personality assessment results",
    order: 5,
  },
  completed: {
    id: "completed",
    label: "Completed",
    description: "Assessment completed",
    order: 6,
  },
};

export function getNextStep(
  currentStep: AssessmentStep,
): AssessmentStep | null {
  const currentIndex = ASSESSMENT_STEPS.indexOf(currentStep);
  if (currentIndex === -1 || currentIndex === ASSESSMENT_STEPS.length - 1) {
    return null;
  }
  return ASSESSMENT_STEPS[currentIndex + 1];
}

export function getPreviousStep(
  currentStep: AssessmentStep,
): AssessmentStep | null {
  const currentIndex = ASSESSMENT_STEPS.indexOf(currentStep);
  if (currentIndex <= 0) {
    return null;
  }
  return ASSESSMENT_STEPS[currentIndex - 1];
}

export function getStepOrder(step: AssessmentStep): number {
  return STEP_INFO[step].order;
}
