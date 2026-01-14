// src/pages/onboarding/BrokerOnboarding.tsx
// REQ-126: Broker Onboarding Page
import React from 'react';
import { Stack } from '@unicornlove/beyond-ui';
import { useOnboarding } from '../../hooks/useOnboarding';
import OnboardingWizard from '../../components/Onboarding/OnboardingWizard';
import BrokerInfoStep from '../../components/Onboarding/steps/broker/BrokerInfoStep';
import AgencyStep from '../../components/Onboarding/steps/broker/AgencyStep';
import ClientInviteStep from '../../components/Onboarding/steps/broker/ClientInviteStep';
import SuccessStep from '../../components/Onboarding/steps/broker/SuccessStep';

function BrokerOnboarding() {
  const {
    currentStep,
    totalSteps,
    data,
    goToNextStep,
    goToPreviousStep,
    completeOnboarding,
    isLoading,
  } = useOnboarding('broker');

  const handleStepComplete = async (stepData: any) => {
    await goToNextStep(stepData);
  };

  const handleComplete = async () => {
    await completeOnboarding({});
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <BrokerInfoStep
            onComplete={handleStepComplete}
            initialData={data}
            isLoading={isLoading}
          />
        );
      case 2:
        return (
          <AgencyStep
            onComplete={handleStepComplete}
            initialData={data}
            isLoading={isLoading}
          />
        );
      case 3:
        return (
          <ClientInviteStep
            onComplete={handleStepComplete}
            initialData={data}
            isLoading={isLoading}
          />
        );
      case 4:
        return (
          <SuccessStep
            onComplete={handleComplete}
            isLoading={isLoading}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Stack style={{ flex: 1 }}>
      <OnboardingWizard
        userType="broker"
        currentStep={currentStep}
        totalSteps={totalSteps}
        onStepComplete={handleStepComplete}
        onComplete={handleComplete}
        onBack={goToPreviousStep}
        canSkip={currentStep === 3} // Client Invite step is optional
        isLoading={isLoading}
      >
        {renderStepContent()}
      </OnboardingWizard>
    </Stack>
  );
}

export default BrokerOnboarding;
