import {
  useAssessmentStatus,
  useSaveLuscher1Mutation,
  useSaveIPIPProgressMutation,
  useSaveLuscher2Mutation,
  useGenerateReportMutation,
  useUpdateCurrentStepMutation,
} from '@scf/core/utils/personality-assessment-sdk-hooks'
import { useQueryClient } from '@tanstack/react-query'
import type { AssessmentStep } from '../utils/assessment-steps'

export function usePersonalityAssessment() {
  const queryClient = useQueryClient()

  // Get assessment status
  const { data: assessmentData, isLoading, error } = useAssessmentStatus()

  // See PersonalityAssessmentWidget: getStatus() is bare, not enveloped (#744).
  const assessment = assessmentData

  // Save Luscher 1
  const saveLuscher1 = useSaveLuscher1Mutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personality-assessment', 'status'] })
    },
  })

  // Save IPIP progress
  const saveIPIPProgress = useSaveIPIPProgressMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personality-assessment', 'status'] })
    },
  })

  // Save Luscher 2
  const saveLuscher2 = useSaveLuscher2Mutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personality-assessment', 'status'] })
    },
  })

  // Generate report
  const generateReport = useGenerateReportMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personality-assessment', 'status'] })
      queryClient.invalidateQueries({ queryKey: ['personality-assessment', 'results'] })
    },
  })

  // Update current step
  const updateCurrentStep = useUpdateCurrentStepMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personality-assessment', 'status'] })
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
