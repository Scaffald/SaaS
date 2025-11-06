import { useRouter } from 'expo-router'
import { useToastController } from '@tamagui/toast'
import { AssessmentWizard } from '@app/core/features/assessments'
import { LuscherTestStep } from '@app/core/features/personality-assessment/components/LuscherTestStep'
import { api } from '@app/core/utils/api'
import { ROUTES } from '@app/core/constants/routes'

/**
 * LuscherTest2Wizard - Standalone wizard for Luscher Color Test 2 (Aspirational)
 */
export function LuscherTest2Wizard() {
  const router = useRouter()
  const toast = useToastController()

  const { data: status, isLoading, error } = api.personalityAssessment.getLuscherTest2Status.useQuery()
  const { data: assessment } = api.personalityAssessment.getAssessmentStatus.useQuery()
  const utils = api.useUtils()

  const saveMutation = api.personalityAssessment.saveLuscher2.useMutation({
    onSuccess: () => {
      // Invalidate status queries to update drawer checkmarks
      utils.personalityAssessment.getLuscherTest2Status.invalidate()
      utils.personalityAssessment.getAssessmentStatus.invalidate()
      toast.show('Test Complete', {
        message: 'Your aspirational color preferences have been saved!',
      })
      router.push(ROUTES.DASHBOARD.path)
    },
    onError: (error: { message?: string }) => {
      toast.show('Error', {
        message: error.message || 'Failed to save test. Please try again.',
      })
    },
  })

  const handleSave = (choices: number[], results?: string) => {
    saveMutation.mutate({ choices, results })
  }

  return (
    <AssessmentWizard
      title="Aspirational Color Test"
      description="Select 8 colors based on your aspirational preferences - the colors you'd like to prefer."
      steps={[{ id: 'test', label: 'Color Selection', order: 1 }]}
      currentStep="test"
      completionScore={status?.isCompleted ? 100 : 0}
      isLoading={isLoading}
      error={error}
      showNext={false}
    >
      <LuscherTestStep
        step="luscher2"
        initialChoices={assessment?.luscher2_choices || []}
        onSave={handleSave}
        isLoading={saveMutation.isPending}
      />
    </AssessmentWizard>
  )
}

