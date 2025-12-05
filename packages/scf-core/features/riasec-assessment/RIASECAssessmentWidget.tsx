import { ROUTES } from '@scf/core/constants/routes'
import { api } from '@scf/core/utils/api'
import { Button, DashboardWidget, spacing } from '@unicornlove/ui'
import { useRouter } from 'expo-router'
import { Spinner, Text, YStack } from '@unicornlove/ui'

/**
 * RIASECAssessmentWidget - Dashboard widget CTA for RIASEC Career Interests
 */
export function RIASECAssessmentWidget() {
  const router = useRouter()

  const { data: status, isLoading } = api.onet.getRIASECStatus.useQuery()

  if (isLoading) {
    return (
      <DashboardWidget>
        <YStack gap={spacing.sm} alignItems="center" paddingVertical={spacing['2xl']}>
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
    router.push(ROUTES.DASHBOARD.ASSESSMENTS.RIASEC.path)
  }

  return (
    <DashboardWidget>
      <YStack gap={spacing.md}>
        <YStack gap={spacing.xs}>
          <Text fontSize="$6" fontWeight="bold" color="$color12">
            Career Interests
          </Text>
          <Text fontSize="$3" color="$color11">
            Rate your interest in 6 career dimensions to discover careers that match your interests.
          </Text>
        </YStack>

        <Button variant="primary" onPress={handleStart} size="$5">
          <Button.Text>Start Interest Assessment</Button.Text>
        </Button>

        <Text fontSize="$2" color="$color11">
          Takes about 2-3 minutes
        </Text>
      </YStack>
    </DashboardWidget>
  )
}
