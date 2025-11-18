import { useRouter } from 'expo-router'
import { useToastController } from '@tamagui/toast'
import { AssessmentWizard } from '@app/core/features/assessments'
import { IPIPTestStep } from '@app/core/features/personality-assessment/components/IPIPTestStep'
import { api } from '@app/core/utils/api'
import { ROUTES } from '@app/core/constants/routes'
import type { IPIPAnswer } from '@app/core/features/personality-assessment/lib/ipip'

interface SaveIPIPProgressResult {
  success: boolean
  isComplete: boolean
}

/**
 * IPIPAssessmentWizard - Standalone wizard for IPIP
 */
export function IPIPAssessmentWizard() {
  const router = useRouter()
  const toast = useToastController()

  const { data: status, isLoading, error } = api.personalityAssessment.getIPIPStatus.useQuery()
  const { data: assessment } = api.personalityAssessment.getAssessmentStatus.useQuery()
  const utils = api.useUtils()

  const saveMutation = api.personalityAssessment.saveIPIPProgress.useMutation({
    onSuccess: (result: SaveIPIPProgressResult) => {
      // Invalidate status queries to update drawer checkmarks
      utils.personalityAssessment.getIPIPStatus.invalidate()
      utils.personalityAssessment.getAssessmentStatus.invalidate()
      if (result.isComplete) {
        toast.show('Questions Complete', {
          message: 'Your personality assessment has been saved!',
        })
        router.push(ROUTES.DASHBOARD.path)
      }
    },
    onError: (error: { message?: string }) => {
      toast.show('Error', {
        message: error.message || 'Failed to save progress. Please try again.',
      })
    },
  })

  const handleSave = (answers: IPIPAnswer[], index: number) => {
    saveMutation.mutate({
      answers,
      current_index: index,
      language: assessment?.ipip_language || 'en',
    })
  }

  const progress = status?.progress || 0
  const completionScore = Math.round((progress / 120) * 100)

  return (
    <AssessmentWizard
      description="Answer 120 questions to discover your personality traits."
      steps={[{ id: 'questions', label: 'Questions', order: 1 }]}
      currentStep="questions"
      completionScore={completionScore}
      isLoading={isLoading}
      error={error}
      showNext={false}
    >
      <IPIPTestStep
        initialAnswers={(assessment?.ipip_answers as IPIPAnswer[]) || []}
        currentIndex={assessment?.ipip_current_index || 0}
        language={assessment?.ipip_language || 'en'}
        onSave={handleSave}
        isLoading={saveMutation.isPending}
      />
    </AssessmentWizard>
  )
}
