import { useRouter } from 'expo-router'
import { YStack, Text, Button, Spinner } from 'tamagui'
import { DashboardWidget, Button as StyledButton, spacing } from '@app/ui'
import { api } from '@app/core/utils/api'
import { ROUTES } from '@app/core/constants/routes'

/**
 * IPIPAssessmentWidget - Dashboard widget CTA for IPIP Personality Questions
 */
export function IPIPAssessmentWidget() {
  const router = useRouter()

  const { data: status, isLoading } = api.personalityAssessment.getIPIPStatus.useQuery()

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

  if (status?.isCompleted) {
    return null
  }

  const handleStart = () => {
    router.push(ROUTES.DASHBOARD_ASSESSMENT_IPIP.path)
  }

  const progress = status?.progress || 0
  const hasStarted = progress > 0

  return (
    <DashboardWidget>
      <YStack gap={spacing.md}>
        <YStack gap={spacing.xs}>
          <Text fontSize="$6" fontWeight="bold" color="$color12">
            Personality Questions
          </Text>
          <Text fontSize="$3" color="$color11">
            Answer 120 questions to discover your personality traits using the Big Five personality
            model.
          </Text>
        </YStack>

        <StyledButton variant="primary" onPress={handleStart} size="$5">
          <Button.Text>{hasStarted ? 'Continue Questions' : 'Start Questions'}</Button.Text>
        </StyledButton>

        <Text fontSize="$2" color="$color11">
          {hasStarted ? `${progress}/120 questions answered` : 'Takes about 10-15 minutes'}
        </Text>
      </YStack>
    </DashboardWidget>
  )
}
