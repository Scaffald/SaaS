import { ROUTES } from '@scf/core/constants/routes'
import { useOccupationStatus } from '@scf/core/utils/onet-sdk-hooks'
import { Button, DashboardWidget, useThemeContext } from '@scaffald/ui'
import { useRouter } from 'expo-router'
import { Spinner, Text, Stack } from '@scaffald/ui'

/**
 * OccupationAssessmentWidget - Dashboard widget CTA for Occupation Preferences
 */
export function OccupationAssessmentWidget() {
  useThemeContext()
  const router = useRouter()

  const { data: status, isLoading } = useOccupationStatus()

  if (isLoading) {
    return (
      <DashboardWidget>
        <Stack gap={8} align="center" paddingVertical={40}>
          <Spinner size="lg" color="primary" />
          <Text color="$gray11">Loading...</Text>
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
      <Stack gap={12}>
        <Stack gap={4}>
          <Text color="$gray11">Occupation Preferences</Text>
          <Text color="$gray11">
            Tell us about your current occupation and target occupations to help us recommend
            relevant opportunities.
          </Text>
        </Stack>

        <Button variant="filled" color="primary" onPress={handleStart} size="lg">
          Add Occupations
        </Button>

        <Text color="$gray11">Takes about 1-2 minutes (optional)</Text>
      </Stack>
    </DashboardWidget>
  )
}
