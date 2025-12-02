import { api } from '@app/core/utils/api'
import type { AssessmentStep } from '../utils/assessment-steps.ts'

export function usePersonalityAssessment() {
  const utils = api.useUtils()

  // Get assessment status
  const {
    data: assessment,
    isLoading,
    error,
  } = api.personalityAssessment.getAssessmentStatus.useQuery()

  // Save Luscher 1
  const saveLuscher1 = api.personalityAssessment.saveLuscher1.useMutation({
    onSuccess: () => {
      utils.personalityAssessment.getAssessmentStatus.invalidate()
    },
  })

  // Save IPIP progress
  const saveIPIPProgress = api.personalityAssessment.saveIPIPProgress.useMutation({
    onSuccess: () => {
      utils.personalityAssessment.getAssessmentStatus.invalidate()
    },
  })

  // Save Luscher 2
  const saveLuscher2 = api.personalityAssessment.saveLuscher2.useMutation({
    onSuccess: () => {
      utils.personalityAssessment.getAssessmentStatus.invalidate()
    },
  })

  // Generate report
  const generateReport = api.personalityAssessment.generateReport.useMutation({
    onSuccess: () => {
      utils.personalityAssessment.getAssessmentStatus.invalidate()
      utils.personalityAssessment.getResults.invalidate()
    },
  })

  // Update current step
  const updateCurrentStep = api.personalityAssessment.updateCurrentStep.useMutation({
    onSuccess: () => {
      utils.personalityAssessment.getAssessmentStatus.invalidate()
    },
  })

  const currentStep = (assessment?.current_step as AssessmentStep) || 'luscher1'
  const completionScore = assessment?.completion_score || 0

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
  }
}
