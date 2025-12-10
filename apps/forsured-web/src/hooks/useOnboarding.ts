// src/hooks/useOnboarding.ts
// REQ-126: Onboarding State Management Hook
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface OnboardingState {
  currentStep: number;
  totalSteps: number;
  data: any; // Data collected during onboarding
  isComplete: boolean;
}

// Total steps per user type
const TOTAL_STEPS: Record<'gc' | 'contractor' | 'broker', number> = {
  gc: 4, // Company, Insurance, Project, Success
  contractor: 4, // Company, Insurance, COI Upload, Success
  broker: 4, // Broker Info, Agency, Client Invite, Success
};

const initialOnboardingState: OnboardingState = {
  currentStep: 1,
  totalSteps: 3,
  data: {},
  isComplete: false,
};

export function useOnboarding(userType: 'gc' | 'contractor' | 'broker') {
  const { profile, updateProfile, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [onboardingState, setOnboardingState] = useState<OnboardingState>({
    ...initialOnboardingState,
    totalSteps: TOTAL_STEPS[userType],
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    // Load saved progress from profile
    if (profile) {
      if (profile.onboarding_completed) {
        // Already completed, navigate to dashboard
        navigate(`/${userType}/dashboard`);
        return;
      }

      // Resume from saved step
      const savedStep = profile.onboarding_step || 1;
      const savedData = profile.onboarding_data || {};
      
      setOnboardingState(prev => ({
        ...prev,
        currentStep: savedStep,
        data: savedData,
        isComplete: false,
        totalSteps: TOTAL_STEPS[userType],
      }));
    }
  }, [profile, authLoading, navigate, userType]);

  const goToNextStep = async (stepData: any) => {
    setIsLoading(true);
    try {
      const nextStep = onboardingState.currentStep + 1;
      const updatedData = { ...onboardingState.data, ...stepData };

      // Save progress to database
      await updateProfile({
        onboarding_step: nextStep,
        onboarding_data: updatedData,
      });

      setOnboardingState(prev => ({
        ...prev,
        currentStep: nextStep,
        data: updatedData,
      }));
    } catch (error) {
      console.error('[useOnboarding] Failed to save progress:', error);
      // Still update local state even if DB save fails
      setOnboardingState(prev => ({
        ...prev,
        currentStep: prev.currentStep + 1,
        data: { ...prev.data, ...stepData },
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const goToPreviousStep = () => {
    setOnboardingState(prev => ({
      ...prev,
      currentStep: Math.max(1, prev.currentStep - 1),
    }));
  };

  const completeOnboarding = async (finalData: any) => {
    setIsLoading(true);
    try {
      const completedData = { ...onboardingState.data, ...finalData };

      // Mark onboarding as complete
      await updateProfile({
        onboarding_completed: true,
        onboarding_data: completedData,
        onboarding_completed_at: new Date().toISOString(),
      });

      setOnboardingState(prev => ({
        ...prev,
        isComplete: true,
        data: completedData,
      }));

      // Redirect to dashboard
      navigate(`/${userType}/dashboard`);
    } catch (error) {
      console.error('[useOnboarding] Failed to complete onboarding:', error);
      // Still redirect even if DB update fails
      navigate(`/${userType}/dashboard`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Skip onboarding entirely - marks as complete without requiring data
   * This allows users to explore the app and come back to setup later
   */
  const skipOnboarding = async () => {
    setIsLoading(true);
    try {
      // Mark onboarding as complete (skipped)
      await updateProfile({
        onboarding_completed: true,
        onboarding_data: { ...onboardingState.data, skipped: true },
        onboarding_completed_at: new Date().toISOString(),
      });

      setOnboardingState(prev => ({
        ...prev,
        isComplete: true,
      }));

      // Redirect to dashboard
      navigate(`/${userType}/dashboard`);
    } catch (error) {
      console.error('[useOnboarding] Failed to skip onboarding:', error);
      // Still redirect even if DB update fails
      navigate(`/${userType}/dashboard`);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    ...onboardingState,
    goToNextStep,
    goToPreviousStep,
    completeOnboarding,
    skipOnboarding,
    isLoading: isLoading || authLoading,
  };
}
