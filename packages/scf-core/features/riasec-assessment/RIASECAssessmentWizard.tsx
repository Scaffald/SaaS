import { ROUTES } from '@scf/core/constants/routes'
import { AssessmentWizard } from '@scf/core/features/assessments'
import { RiasecQuickAssessment } from '@scf/core/features/career-assessment/components/RiasecQuickAssessment'
import {
  careerAssessmentDefaults,
  type RiasecScores,
} from '@scf/core/features/career-assessment/config/career-assessment-schema'
import { useRIASECStatus, useSaveCareerAssessmentMutation } from '@scf/core/utils/onet-sdk-hooks'
import { useToast } from '@unicornlove/beyond-ui'
import { useRouter } from 'expo-router'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Button, Stack } from '@unicornlove/beyond-ui'

/**
 * RIASECAssessmentWizard - Standalone wizard for RIASEC Career Interests
 */
export function RIASECAssessmentWizard() {
  const router = useRouter()
  const toast = useToast()

  const { data: status, isLoading, error } = useRIASECStatus()
  const [scores, setScores] = useState<RiasecScores>(careerAssessmentDefaults.riasec_scores)
  const queryClient = useQueryClient()

  // Load existing scores when status is available
  useEffect(() => {
    if (status?.scores) {
      setScores(status.scores as RiasecScores)
    }
  }, [status])

  const saveMutation = useSaveCareerAssessmentMutation({
    onSuccess: () => {
      // Invalidate status queries to update drawer checkmarks
      queryClient.invalidateQueries({ queryKey: ['scaffald', 'onet', 'riasec', 'status'] })
      toast.show({
        title: 'Assessment Complete',
        message: 'Your career interests have been saved!',
        variant: 'success',
      })
      router.push(ROUTES.DASHBOARD.path)
    },
    onError: (error: { message?: string }) => {
      toast.show({
        title: 'Error',
        message: error.message || 'Failed to save assessment. Please try again.',
        variant: 'error',
      })
    },
  })

  const handleComplete = () => {
    saveMutation.mutate({
      riasec_scores: scores,
      current_occupation_code: undefined,
      target_occupation_codes: undefined,
    })
  }

  const allRated = Object.values(scores).every(
    (score) => typeof score === 'number' && score >= 1 && score <= 5
  )

  const queryError = error ? new Error(error.message ?? 'Failed to load assessment status.') : null

  return (
    <AssessmentWizard
      title="Career Interests"
      description="Rate your interest in each career dimension using the sliders below."
      steps={[{ id: 'interests', label: 'Interest Rating', order: 1 }]}
      currentStep="interests"
      completionScore={status?.isCompleted ? 100 : 0}
      isLoading={isLoading}
      error={queryError}
      showNext={false}
    >
      <Stack gap={16} width="100%" maxWidth={800} marginHorizontal="auto">
        <RiasecQuickAssessment
          value={scores}
          onChange={setScores}
          disabled={saveMutation.isPending}
        />

        <Button
          size={20}
          themeInverse
          onPress={handleComplete}
          disabled={!allRated || saveMutation.isPending}
        >
          <Button.Text>Complete Assessment</Button.Text>
        </Button>
      </Stack>
    </AssessmentWizard>
  )
}
