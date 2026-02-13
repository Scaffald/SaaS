import { ROUTES } from '@scf/core/constants/routes'
import { useAssessmentStatus } from '@scf/core/utils/personality-assessment-sdk-hooks'
import { Button, DashboardWidget, spacing } from '@unicornlove/beyond-ui'
import { useRouter } from 'expo-router'
import { Progress, Spinner, Text, Row, Stack } from '@unicornlove/beyond-ui'

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
  const { data: assessmentData, isLoading } = useAssessmentStatus()
  const assessment = assessmentData?.data

  // Don't show widget if already completed
  if (isLoading) {
    return (
      <DashboardWidget>
        <Stack gap={spacing.sm} align="center" paddingVertical={spacing['2xl']}>
          <Spinner size="lg" color="$blue7" />
          <Text color="$gray11">Loading...</Text>
        </Stack>
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
      <Stack gap={spacing.md}>
        <Stack gap={spacing.xs}>
          <Text color="$gray11">Personality Assessment</Text>
          <Text color="$gray11">
            Discover your personality traits through a comprehensive assessment including color
            psychology and personality questions.
          </Text>
        </Stack>

        {/* Progress Display */}
        {hasStarted && (
          <Stack gap={spacing.xs}>
            <Row justify="space-between" align="center">
              <Text color="$gray11">{getStepLabel(currentStep)}</Text>
              <Text color="$blue8">{completionScore}%</Text>
            </Row>
            <Progress value={completionScore} max={100}>
              <Progress.Indicator animation="bouncy" backgroundColor="$blue7" />
            </Progress>
            <Text color="$gray11">
              {hasStarted ? 'Continue where you left off' : 'Start your assessment'}
            </Text>
          </Stack>
        )}

        {/* Action Button */}
        <Button
          variant="primary"
          onPress={handleStart}
          size="lg"
          marginTop={hasStarted ? spacing.xs : spacing.md}
        >
          <Button.Text>{hasStarted ? 'Continue Assessment' : 'Start Assessment'}</Button.Text>
        </Button>

        {!hasStarted && (
          <Text color="$gray11">
            This assessment takes about 10-15 minutes and includes color tests and 120 personality
            questions.
          </Text>
        )}
      </Stack>
    </DashboardWidget>
  )
}
