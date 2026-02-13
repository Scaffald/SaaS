import { ROUTES } from '@scf/core/constants/routes'
import { useRIASECStatus } from '@scf/core/utils/onet-sdk-hooks'
import { Button, DashboardWidget, spacing } from '@unicornlove/beyond-ui'
import { useRouter } from 'expo-router'
import { Spinner, Text, Stack } from '@unicornlove/beyond-ui'

/**
 * RIASECAssessmentWidget - Dashboard widget CTA for RIASEC Career Interests
 */
export function RIASECAssessmentWidget() {
  const router = useRouter()

  const { data: status, isLoading } = useRIASECStatus()

  if (isLoading) {
    return (
      <DashboardWidget>
        <Stack gap={spacing.sm} align="center" paddingVertical={spacing['2xl']}>
          <Spinner size="lg" color="$blue7" />
          <Text color="gray">Loading...</Text>
        </Stack>
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
      <Stack gap={spacing.md}>
        <Stack gap={spacing.xs}>
          <Text color="gray">Career Interests</Text>
          <Text color="gray">
            Rate your interest in 6 career dimensions to discover careers that match your interests.
          </Text>
        </Stack>

        <Button variant="primary" onPress={handleStart} size={20}>
          <Button.Text>Start Interest Assessment</Button.Text>
        </Button>

        <Text color="gray">Takes about 2-3 minutes</Text>
      </Stack>
    </DashboardWidget>
  )
}
