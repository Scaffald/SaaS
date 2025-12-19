import React from 'react';
import { useNavigate } from 'react-router-dom';
import SubcontractorPrequalificationWizard, {
  PrequalificationData,
} from './SubcontractorPrequalificationWizard';
import { useAuth } from '../../contexts/AuthContext';

interface SubcontractorOnboardingProps {
  invitationToken?: string;
}

export default function SubcontractorOnboarding({
  invitationToken,
}: SubcontractorOnboardingProps) {
  const navigate = useNavigate();
  const { updateProfile } = useAuth();

  const masseiInvitationData = {
    gcName: 'Massei Construction',
    customMessage: `Welcome to Massei Construction's subcontractor network! We're excited to learn more about your company. Please complete this prequalification form so we can evaluate your capabilities and insurance coverage. This information helps us ensure all our partners meet our safety and compliance standards.`,
    customRequirements: {
      generalLiability: {
        required: true,
        minimumCoverage: 2000000,
        additionalInsured: true,
      },
      workersCompensation: {
        required: true,
        minimumCoverage: 1000000,
        waiverOfSubrogation: true,
      },
      autoLiability: {
        required: true,
        minimumCoverage: 1000000,
      },
      umbrella: {
        required: false,
        minimumCoverage: 5000000,
      },
    },
    invitationId: 'massei-demo-invitation-001',
  };

  const handleComplete = async (data: PrequalificationData) => {
    try {
      // Mark onboarding as complete with form data
      await updateProfile({
        onboarding_completed: true,
        onboarding_data: data,
        onboarding_completed_at: new Date().toISOString(),
      });
      console.log('Prequalification data submitted:', data);
      navigate('/subcontractor/dashboard');
    } catch (error) {
      console.error('Failed to save onboarding data:', error);
      // Still redirect even on error
      navigate('/subcontractor/dashboard');
    }
  };

  const handleSkip = async () => {
    try {
      // Mark onboarding as complete (skipped)
      await updateProfile({
        onboarding_completed: true,
        onboarding_data: { skipped: true },
        onboarding_completed_at: new Date().toISOString(),
      });
      navigate('/subcontractor/dashboard');
    } catch (error) {
      console.error('Failed to skip onboarding:', error);
      // Still redirect even on error
      navigate('/subcontractor/dashboard');
    }
  };

  return (
    <SubcontractorPrequalificationWizard
      invitationData={masseiInvitationData}
      onComplete={handleComplete}
      onSkip={handleSkip}
    />
  );
}
