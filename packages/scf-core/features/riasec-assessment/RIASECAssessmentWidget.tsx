import { ROUTES } from '@scf/core/constants/routes'
import { api } from '@scf/core/utils/api'
import { Button, DashboardWidget, spacing } from '@unicornlove/beyond-ui'
import { useRouter } from 'expo-router'
import { Spinner, Text, Stack } from '@unicornlove/beyond-ui'

/**
 * RIASECAssessmentWidget - Dashboard widget CTA for RIASEC Career Interests
 */
export function RIASECAssessmentWidget() {
  const router = useRouter()

  const { data: status, isLoading } = api.onet.getRIASECStatus.useQuery()

  if (isLoading) {
    return (
      <DashboardWidget>
        <Stack gap={spacing.sm} alignItems="center" paddingVertical={spacing['2xl']}>
          <Spinner size="large" color="$blue7" />
          <Text color="$color11">Loading...</Text>
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
          <Text fontSize="$6" fontWeight="bold" color="$color12">
            Career Interests
          </Text>
          <Text fontSize="$3" color="$color11">
            Rate your interest in 6 career dimensions to discover careers that match your interests.
          </Text>
        </Stack>

        <Button variant="primary" onPress={handleStart} size="$5">
          <Button.Text>Start Interest Assessment</Button.Text>
        </Button>

        <Text fontSize="$2" color="$color11">
          Takes about 2-3 minutes
        </Text>
      </Stack>
    </DashboardWidget>
  )
}
