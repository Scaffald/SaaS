import { Button, Text, YStack } from 'tamagui'
import { useRouter } from 'expo-router'
import { useToastController } from '@tamagui/toast'
import { AssessmentWizard } from '@app/core/features/assessments'
import { LuscherTestStep } from '@app/core/features/personality-assessment/components/LuscherTestStep'
import { api } from '@app/core/utils/api'
import { ROUTES } from '@app/core/constants/routes'

/**
 * LuscherTest1Wizard - Standalone wizard for Luscher Color Test 1
 */
export function LuscherTest1Wizard() {
  const router = useRouter()
  const toast = useToastController()

  // Get assessment status
  const { data: status, isLoading, error } = api.personalityAssessment.getLuscherTest1Status.useQuery()
  
  // Get existing choices if available
  const { data: assessment } = api.personalityAssessment.getAssessmentStatus.useQuery()
  
  const utils = api.useUtils()

  // Save mutation
  const saveMutation = api.personalityAssessment.saveLuscher1.useMutation({
    onSuccess: () => {
      // Invalidate status queries to update drawer checkmarks
      utils.personalityAssessment.getLuscherTest1Status.invalidate()
      utils.personalityAssessment.getAssessmentStatus.invalidate()
      toast.show('Test Complete', {
        message: 'Your color preferences have been saved!',
      })
      router.push(ROUTES.DASHBOARD.path)
    },
    onError: (error: { message?: string }) => {
      toast.show('Error', {
        message: error.message || 'Failed to save test. Please try again.',
      })
    },
  })

  const handleSave = (choices: number[]) => {
    saveMutation.mutate({ choices })
  }

  const steps = [
    { id: 'test', label: 'Color Selection', order: 1 },
  ]

  return (
    <AssessmentWizard
      title="Color Preference Test"
      description="Select 8 colors in order based on what makes you feel the best."
      steps={steps}
      currentStep="test"
      completionScore={status?.isCompleted ? 100 : 0}
      isLoading={isLoading}
      error={error}
      showNext={false}
    >
      <LuscherTestStep
        step="luscher1"
        initialChoices={assessment?.luscher1_choices || []}
        onSave={handleSave}
        isLoading={saveMutation.isPending}
      />
    </AssessmentWizard>
  )
}

