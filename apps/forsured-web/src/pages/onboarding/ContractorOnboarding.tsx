// src/pages/onboarding/ContractorOnboarding.tsx
// REQ-126: Contractor Onboarding Page
import React from 'react';
import { View } from '@unicornlove/ui';
import { useOnboarding } from '../../hooks/useOnboarding';
import OnboardingWizard from '../../components/Onboarding/OnboardingWizard';
import CompanyStep from '../../components/Onboarding/steps/contractor/CompanyStep';
import InsuranceStep from '../../components/Onboarding/steps/contractor/InsuranceStep';
import COIUploadStep from '../../components/Onboarding/steps/contractor/COIUploadStep';
import SuccessStep from '../../components/Onboarding/steps/contractor/SuccessStep';

function ContractorOnboarding() {
  const {
    currentStep,
    totalSteps,
    data,
    goToNextStep,
    goToPreviousStep,
    completeOnboarding,
    isLoading,
  } = useOnboarding('contractor');

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
          <CompanyStep
            onComplete={handleStepComplete}
            initialData={data}
            isLoading={isLoading}
          />
        );
      case 2:
        return (
          <InsuranceStep
            onComplete={handleStepComplete}
            initialData={data}
            isLoading={isLoading}
          />
        );
      case 3:
        return (
          <COIUploadStep
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
    <View flex={1}>
      <OnboardingWizard
        userType="contractor"
        currentStep={currentStep}
        totalSteps={totalSteps}
        onStepComplete={handleStepComplete}
        onComplete={handleComplete}
        onBack={goToPreviousStep}
        canSkip={currentStep === 3} // COI Upload step is optional
        isLoading={isLoading}
      >
        {renderStepContent()}
      </OnboardingWizard>
    </View>
  );
}

export default ContractorOnboarding;
