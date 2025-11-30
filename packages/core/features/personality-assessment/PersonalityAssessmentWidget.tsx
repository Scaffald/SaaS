import { ROUTES } from '@app/core/constants/routes'
import { api } from '@app/core/utils/api'
import { DashboardWidget, UIButton as StyledButton, spacing } from '@scaffald/tamagui-ui'
import { useRouter } from 'expo-router'
import { Progress, Spinner, Text, XStack, YStack } from 'tamagui'

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
        <YStack gap={spacing.sm} items="center" py={spacing['2xl']}>
          <Spinner size="large" color="$blue7" />
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
    router.push(ROUTES.DASHBOARD.ASSESSMENTS.IPIP.path)
  }

  return (
    <DashboardWidget>
      <YStack gap={spacing.md}>
        <YStack gap={spacing.xs}>
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
          <YStack gap={spacing.xs}>
            <XStack justify="space-between" items="center">
              <Text fontSize="$4" fontWeight="600" color="$color12">
                {getStepLabel(currentStep)}
              </Text>
              <Text fontSize="$4" fontWeight="bold" color="$blue8">
                {completionScore}%
              </Text>
            </XStack>
            <Progress value={completionScore} max={100}>
              <Progress.Indicator animation="bouncy" bg="$blue7" />
            </Progress>
            <Text fontSize="$2" color="$color11">
              {hasStarted ? 'Continue where you left off' : 'Start your assessment'}
            </Text>
          </YStack>
        )}

        {/* Action Button */}
        <StyledButton
          variant="primary"
          onPress={handleStart}
          size="$5"
          mt={hasStarted ? spacing.xs : spacing.md}
        >
          <StyledButton.Text>
            {hasStarted ? 'Continue Assessment' : 'Start Assessment'}
          </StyledButton.Text>
        </StyledButton>

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
