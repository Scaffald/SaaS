/**
 * OnboardingNavigation - Navigation component using Beyond UI
 * REQ-126: Onboarding Navigation Component
 */
import React from 'react';
import { Row, Button } from '@unicornlove/beyond-ui';

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
    <Row
      style={{
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 32,
      }}
    >
      <Button
        variant="outlined"
        onClick={onBack}
        disabled={currentStep === 1 || isLoading}
      >
        Back
      </Button>

      <Row style={{ gap: 8 }}>
        {canSkip && onSkip && (
          <Button
            variant="ghost"
            onClick={onSkip}
            disabled={isLoading}
          >
            Skip
          </Button>
        )}
        <Button
          variant="primary"
          onClick={onNext}
          disabled={isLoading}
        >
          {isLastStep ? 'Finish' : 'Next'}
        </Button>
      </Row>
    </Row>
  );
}

export default OnboardingNavigation;
