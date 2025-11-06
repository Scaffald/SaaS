import { useRouter } from 'expo-router'
import { YStack, Text, Button, Spinner, XStack, Progress } from 'tamagui'
import { DashboardWidget } from '@app/ui'
import { api } from '@app/core/utils/api'
import { ROUTES } from '@app/core/constants/routes'

/**
 * PersonalityAssessmentWidget - Dashboard widget for personality assessment
 *
 * Displays:
 * - Completion status and progress
 * - "Start Assessment" or "Continue Assessment" button
 * - Links to assessment wizard
 */
export function PersonalityAssessmentWidget() {
  const router = useRouter()

  // Get assessment status
  const { data: assessment, isLoading } = api.personalityAssessment.getAssessmentStatus.useQuery()

  // Don't show widget if already completed
  if (isLoading) {
    return (
      <DashboardWidget>
        <YStack gap="$3" items="center" py="$8">
          <Spinner size="large" />
          <Text color="$color11">Loading...</Text>
        </YStack>
      </DashboardWidget>
    )
  }

  // Hide widget if assessment is complete
  if (assessment?.current_step === 'completed' || assessment?.completion_score === 100) {
    return null
  }

  const completionScore = assessment?.completion_score || 0
  const hasStarted = completionScore > 0
  const currentStep = assessment?.current_step || 'luscher1'

  const getStepLabel = (step: string) => {
    switch (step) {
      case 'luscher1':
        return 'Color Test 1'
      case 'ipip':
        return 'Personality Questions'
      case 'luscher2':
        return 'Color Test 2'
      case 'acute':
        return 'Results'
      default:
        return 'Assessment'
    }
  }

  const handleStart = () => {
    router.push(ROUTES.DASHBOARD_ASSESSMENT_PERSONALITY.path)
  }

  return (
    <DashboardWidget>
      <YStack gap="$4">
        <YStack gap="$2">
          <Text fontSize="$6" fontWeight="bold" color="$color12">
            Personality Assessment
          </Text>
          <Text fontSize="$3" color="$color11">
            Discover your personality traits through a comprehensive assessment including color
            psychology and personality questions.
          </Text>
        </YStack>

        {/* Progress Display */}
        {hasStarted && (
          <YStack gap="$2">
            <XStack justify="space-between" items="center">
              <Text fontSize="$4" fontWeight="600" color="$color12">
                {getStepLabel(currentStep)}
              </Text>
              <Text fontSize="$4" fontWeight="bold" color="$blue10">
                {completionScore}%
              </Text>
            </XStack>
            <Progress value={completionScore} max={100}>
              <Progress.Indicator animation="bouncy" />
            </Progress>
            <Text fontSize="$2" color="$color11">
              {hasStarted ? 'Continue where you left off' : 'Start your assessment'}
            </Text>
          </YStack>
        )}

        {/* Action Button */}
        <Button onPress={handleStart} size="$5" themeInverse mt={hasStarted ? '$2' : '$4'}>
          <Button.Text>{hasStarted ? 'Continue Assessment' : 'Start Assessment'}</Button.Text>
        </Button>

        {!hasStarted && (
          <Text fontSize="$2" color="$color11">
            This assessment takes about 10-15 minutes and includes color tests and 120 personality
            questions.
          </Text>
        )}
      </YStack>
    </DashboardWidget>
  )
}
