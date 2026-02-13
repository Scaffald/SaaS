import { ROUTES } from '@scf/core/constants/routes'
import { useOccupationStatus } from '@scf/core/utils/onet-sdk-hooks'
import { Button, DashboardWidget, spacing } from '@unicornlove/beyond-ui'
import { useRouter } from 'expo-router'
import { Spinner, Text, Stack } from '@unicornlove/beyond-ui'

/**
 * OccupationAssessmentWidget - Dashboard widget CTA for Occupation Preferences
 */
export function OccupationAssessmentWidget() {
  const router = useRouter()

  const { data: status, isLoading } = useOccupationStatus()

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
    router.push(ROUTES.DASHBOARD.ASSESSMENTS.OCCUPATION.path)
  }

  return (
    <DashboardWidget>
      <Stack gap={spacing.md}>
        <Stack gap={spacing.xs}>
          <Text color="gray">
            Occupation Preferences
          </Text>
          <Text color="gray">
            Tell us about your current occupation and target occupations to help us recommend
            relevant opportunities.
          </Text>
        </Stack>

        <Button variant="primary" onPress={handleStart} size={20}>
          <Button.Text>Add Occupations</Button.Text>
        </Button>

        <Text color="gray">
          Takes about 1-2 minutes (optional)
        </Text>
      </Stack>
    </DashboardWidget>
  )
}
