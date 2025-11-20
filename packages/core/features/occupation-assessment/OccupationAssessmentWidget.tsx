import { ROUTES } from '@app/core/constants/routes'
import { api } from '@app/core/utils/api'
import { DashboardWidget, UIButton as StyledButton, spacing } from '@app/ui'
import { useRouter } from 'expo-router'
import { Spinner, Text, YStack } from 'tamagui'

/**
 * OccupationAssessmentWidget - Dashboard widget CTA for Occupation Preferences
 */
export function OccupationAssessmentWidget() {
  const router = useRouter()

  const { data: status, isLoading } = api.onet.getOccupationStatus.useQuery()

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
    router.push(ROUTES.DASHBOARD_ASSESSMENT_OCCUPATION.path)
  }

  return (
    <DashboardWidget>
      <YStack gap={spacing.md}>
        <YStack gap={spacing.xs}>
          <Text fontSize="$6" fontWeight="bold" color="$color12">
            Occupation Preferences
          </Text>
          <Text fontSize="$3" color="$color11">
            Tell us about your current occupation and target occupations to help us recommend
            relevant opportunities.
          </Text>
        </YStack>

        <StyledButton variant="primary" onPress={handleStart} size="$5">
          <StyledButton.Text>Add Occupations</StyledButton.Text>
        </StyledButton>

        <Text fontSize="$2" color="$color11">
          Takes about 1-2 minutes (optional)
        </Text>
      </YStack>
    </DashboardWidget>
  )
}
