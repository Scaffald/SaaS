import { ROUTES } from '@scf/core/constants/routes'
import { useOccupationStatus } from '@scf/core/utils/onet-sdk-hooks'
import { Button, DashboardWidget, useThemeContext } from '@scaffald/ui'
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
    router.push(ROUTES.ASSESSMENTS.OCCUPATION.path)
  }

  const labelStyle = {
    fontSize: 10,
    fontWeight: '800' as const,
    color: colors.text[theme].tertiary,
    textTransform: 'uppercase' as const,
    letterSpacing: 1.5,
  }

  const metaStyle = {
    fontSize: 11,
    fontWeight: '600' as const,
    color: colors.text[theme].tertiary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  }

  return (
    <DashboardWidget>
      <Stack gap={12}>
        <Stack gap={4}>
          <Text style={labelStyle}>Occupation</Text>
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text[theme].primary }}>
            Occupation Preferences
          </Text>
        </Stack>
        <Text style={{ color: colors.text[theme].secondary }}>
          Tell us about your current occupation and target occupations to help us recommend
          relevant opportunities.
        </Text>

        <Button variant="outline" color="gray" size="sm" fullWidth onPress={handleStart}>
          Add Occupations
        </Button>

        <Text style={metaStyle}>Takes about 1-2 minutes (optional)</Text>
      </Stack>
    </DashboardWidget>
  )
}
