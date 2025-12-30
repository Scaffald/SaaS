/**
 * OnboardingNavigation - Navigation component using Tamagui
 * REQ-126: Onboarding Navigation Component
 */
import React from 'react';
import { XStack } from '@unicornlove/ui';
import { Button } from '@unicornlove/ui';

interface OnboardingNavigationProps {
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  onSkip?: () => void;
  isLastStep: boolean;
  canSkip: boolean;
  isLoading?: boolean;
}

function OnboardingNavigation({
  currentStep,
  totalSteps,
  onBack,
  onNext,
  onSkip,
  isLastStep,
  canSkip,
  isLoading = false,
}: OnboardingNavigationProps) {
  return (
    <XStack
      alignItems="center"
      justifyContent="space-between"
      mt="$8"
    >
      <Button
        variant="outlined"
        onPress={onBack}
        disabled={currentStep === 1 || isLoading}
      >
        Back
      </Button>

      <XStack gap="$2">
        {canSkip && onSkip && (
          <Button
            variant="ghost"
            onPress={onSkip}
            disabled={isLoading}
          >
            Skip
          </Button>
        )}
        <Button
          variant="primary"
          onPress={onNext}
          disabled={isLoading}
        >
          {isLastStep ? 'Finish' : 'Next'}
        </Button>
      </XStack>
    </XStack>
  );
}

export default OnboardingNavigation;
