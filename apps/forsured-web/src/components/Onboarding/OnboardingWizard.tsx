/**
 * OnboardingWizard - Onboarding wizard using Beyond UI
 * Onboarding Wizard Base Component
 */
import React from 'react';
import { Stack } from '@unicornlove/beyond-ui';
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
    <Stack
      style={{
        maxWidth: 672,
        width: '100%',
        alignSelf: 'center',
        paddingLeft: 16,
        paddingRight: 16,
        paddingTop: 32,
        paddingBottom: 32,
      }}
    >
      <OnboardingProgress current={currentStep} total={totalSteps} />

      <Stack style={{ marginTop: 32 }}>
        {children}
      </Stack>

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
    </Stack>
  );
}

export default OnboardingWizard;
