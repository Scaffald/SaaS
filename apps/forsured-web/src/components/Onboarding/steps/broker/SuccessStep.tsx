// src/components/onboarding/steps/broker/SuccessStep.tsx
// REQ-126: Broker Onboarding - Success/Completion Step
import React from 'react';
import { Button } from '@unicornlove/ui';
import { Heading2, BodyText } from '@unicornlove/ui';
import { Check } from '@unicornlove/ui';

interface SuccessStepProps {
  onComplete: () => Promise<void>;
  isLoading?: boolean;
}

function SuccessStep({ onComplete, isLoading = false }: SuccessStepProps) {
  return (
    <div className="success-step text-center py-8">
      <div className="mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        <Heading2 className="mb-2">Onboarding Complete!</Heading2>
        <BodyText className="text-gray-600">
          You're all set to manage your clients' insurance needs and track compliance.
        </BodyText>
      </div>
      <Button
        onClick={onComplete}
        variant="primary"
        disabled={isLoading}
        size="lg"
      >
        {isLoading ? 'Loading...' : 'Go to Dashboard'}
      </Button>
    </div>
  );
}

export default SuccessStep;
