import { ROUTES } from '@scf/core/constants/routes'
import { useOccupationStatus } from '@scf/core/utils/onet-sdk-hooks'
import { Button, DashboardWidget, DashboardWidgetHeader, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { useRouter } from 'expo-router'
import { Spinner, Text, Stack } from '@scaffald/ui'

/**
 * OccupationAssessmentWidget - Dashboard widget CTA for Occupation Preferences
 */
export function OccupationAssessmentWidget() {
  const { theme } = useThemeContext()
  const router = useRouter()

  const { data: status, isLoading } = useOccupationStatus()

  if (isLoading) {
    return (
      <DashboardWidget>
        <Stack gap={8} align="center" paddingVertical={40}>
          <Spinner variant="ios" size="lg" color="primary" />
          <Text style={{ color: colors.text[theme].secondary }}>Loading...</Text>
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
        <DashboardWidgetHeader title="Occupation Preferences" />
        <Text style={{ color: colors.text[theme].secondary }}>
          Tell us about your current occupation and target occupations to help us recommend
          relevant opportunities.
        </Text>

        <Button variant="filled" color="primary" onPress={handleStart} size="lg">
          Add Occupations
        </Button>

        <Text style={{ color: colors.text[theme].secondary }}>Takes about 1-2 minutes (optional)</Text>
      </Stack>
    </DashboardWidget>
  )
}
