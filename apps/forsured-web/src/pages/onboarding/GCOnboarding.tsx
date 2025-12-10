// src/pages/onboarding/GCOnboarding.tsx
// REQ-126: General Contractor Onboarding Page
import React from 'react';
import { useOnboarding } from '../../hooks/useOnboarding';
import OnboardingWizard from '../../components/Onboarding/OnboardingWizard';
import CompanyStep from '../../components/Onboarding/steps/gc/CompanyStep';
import InsuranceStep from '../../components/Onboarding/steps/gc/InsuranceStep';
import ProjectStep from '../../components/Onboarding/steps/gc/ProjectStep';
import SuccessStep from '../../components/Onboarding/steps/gc/SuccessStep';

function GCOnboarding() {
  const {
    currentStep,
    totalSteps,
    data,
    goToNextStep,
    goToPreviousStep,
    completeOnboarding,
    isLoading,
  } = useOnboarding('gc');

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
          <ProjectStep
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
    <div className="gc-onboarding-page">
      <OnboardingWizard
        userType="gc"
        currentStep={currentStep}
        totalSteps={totalSteps}
        onStepComplete={handleStepComplete}
        onComplete={handleComplete}
        onBack={goToPreviousStep}
        canSkip={currentStep === 3} // Project step is optional
        isLoading={isLoading}
      >
        {renderStepContent()}
      </OnboardingWizard>
    </div>
  );
}

export default GCOnboarding;
