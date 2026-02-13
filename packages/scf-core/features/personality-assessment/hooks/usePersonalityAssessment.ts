import { api } from '@scf/core/utils/api';
import { useQueryClient } from '@tanstack/react-query';
import type { AssessmentStep } from '../utils/assessment-steps';

export function usePersonalityAssessment() {
  const queryClient = useQueryClient();

  // Get assessment status
  const {
    data: assessment,
    isLoading,
    error,
  } = api.personalityAssessment.getAssessmentStatus.useQuery();

  // Save Luscher 1
  const saveLuscher1 = api.personalityAssessment.saveLuscher1.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [['personalityAssessment', 'getAssessmentStatus']] });
    },
  });

  // Save IPIP progress
  const saveIPIPProgress = api.personalityAssessment.saveIPIPProgress
    .useMutation({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [['personalityAssessment', 'getAssessmentStatus']] });
      },
    });

  // Save Luscher 2
  const saveLuscher2 = api.personalityAssessment.saveLuscher2.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [['personalityAssessment', 'getAssessmentStatus']] });
    },
  });

  // Generate report
  const generateReport = api.personalityAssessment.generateReport.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [['personalityAssessment', 'getAssessmentStatus']] });
      queryClient.invalidateQueries({ queryKey: [['personalityAssessment', 'getResults']] });
    },
  });

  // Update current step
  const updateCurrentStep = api.personalityAssessment.updateCurrentStep
    .useMutation({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [['personalityAssessment', 'getAssessmentStatus']] });
      },
    });

  const currentStep = (assessment?.current_step as AssessmentStep) ||
    'luscher1';
  const completionScore = assessment?.completion_score || 0;

  return {
    assessment,
    isLoading,
    error,
    currentStep,
    completionScore,
    saveLuscher1,
    saveIPIPProgress,
    saveLuscher2,
    generateReport,
    updateCurrentStep,
  };
}
