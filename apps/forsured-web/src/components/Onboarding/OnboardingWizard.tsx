/**
 * OnboardingWizard - Onboarding wizard using Tamagui
 * REQ-126: Onboarding Wizard Base Component
 */
import React from 'react';
import { YStack } from '@unicornlove/ui';
import OnboardingProgress from './OnboardingProgress';
import OnboardingNavigation from './OnboardingNavigation';

interface OnboardingWizardProps {
  userType: 'gc' | 'contractor' | 'broker';
  currentStep: number;
  totalSteps: number;
  onStepComplete: (data: any) => Promise<void>;
  onComplete: () => void;
  onBack?: () => void;
  onSkip?: () => void;
  canSkip?: boolean;
  isLoading?: boolean;
  children: React.ReactNode;
}

function OnboardingWizard({
  userType,
  currentStep,
  totalSteps,
  onStepComplete,
  onComplete,
  onBack,
  onSkip,
  canSkip = false,
  isLoading = false,
  children,
}: OnboardingWizardProps) {
  const isLastStep = currentStep === totalSteps;

  const handleNext = async () => {
    if (isLastStep) {
      await onComplete();
    } else {
      await onStepComplete({});
    }
  };

  return (
    <YStack maxWidth={672} width="100%" alignSelf="center" paddingHorizontal="$4" paddingVertical="$8">
      <OnboardingProgress current={currentStep} total={totalSteps} />

      <YStack mt="$8">
        {children}
      </YStack>

      <OnboardingNavigation
        currentStep={currentStep}
        totalSteps={totalSteps}
        onBack={onBack || (() => {})}
        onNext={handleNext}
        onSkip={onSkip}
        isLastStep={isLastStep}
        canSkip={canSkip}
        isLoading={isLoading}
      />
    </YStack>
  );
}

export default OnboardingWizard;
