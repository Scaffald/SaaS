import { useState, useEffect } from 'react'
import { Button, YStack, Text } from 'tamagui'
import { useRouter } from 'expo-router'
import { useToastController } from '@tamagui/toast'
import { AssessmentWizard } from '@app/core/features/assessments'
import { RiasecQuickAssessment } from '@app/core/features/career-assessment/components/RiasecQuickAssessment'
import { api } from '@app/core/utils/api'
import { ROUTES } from '@app/core/constants/routes'
import {
  careerAssessmentDefaults,
  type RiasecScores,
} from '@app/core/features/career-assessment/config/career-assessment-schema'

/**
 * RIASECAssessmentWizard - Standalone wizard for RIASEC Career Interests
 */
export function RIASECAssessmentWizard() {
  const router = useRouter()
  const toast = useToastController()

  const { data: status, isLoading, error } = api.onet.getRIASECStatus.useQuery()
  const [scores, setScores] = useState<RiasecScores>(careerAssessmentDefaults.riasec_scores)
  const utils = api.useUtils()

  // Load existing scores when status is available
  useEffect(() => {
    if (status?.scores) {
      setScores(status.scores as RiasecScores)
    }
  }, [status])

  const saveMutation = api.onet.saveCareerAssessment.useMutation({
    onSuccess: () => {
      // Invalidate status queries to update drawer checkmarks
      utils.onet.getRIASECStatus.invalidate()
      toast.show('Assessment Complete', {
        message: 'Your career interests have been saved!',
      })
      router.push(ROUTES.DASHBOARD.path)
    },
    onError: (error: { message?: string }) => {
      toast.show('Error', {
        message: error.message || 'Failed to save assessment. Please try again.',
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

  const allRated = Object.values(scores).every((score) => typeof score === 'number' && score >= 1 && score <= 5)

  return (
    <AssessmentWizard
      title="Career Interests"
      description="Rate your interest in each career dimension using the sliders below."
      steps={[{ id: 'interests', label: 'Interest Rating', order: 1 }]}
      currentStep="interests"
      completionScore={status?.isCompleted ? 100 : 0}
      isLoading={isLoading}
      error={error}
      showNext={false}
    >
      <YStack gap="$4" width="100%" maxW={800} mx="auto">
        <RiasecQuickAssessment
          value={scores}
          onChange={setScores}
          disabled={saveMutation.isPending}
        />
        
        <Button
          size="$5"
          themeInverse
          onPress={handleComplete}
          disabled={!allRated || saveMutation.isPending}
        >
          <Button.Text>Complete Assessment</Button.Text>
        </Button>
      </YStack>
    </AssessmentWizard>
  )
}

