import { ROUTES } from '@scf/core/constants/routes'
import { api } from '@scf/core/utils/api'
import { Button, DashboardWidget, spacing } from '@unicornlove/ui'
import { useRouter } from 'expo-router'
import { Spinner, Text, YStack } from '@unicornlove/ui'

/**
 * OccupationAssessmentWidget - Dashboard widget CTA for Occupation Preferences
 */
export function OccupationAssessmentWidget() {
  const router = useRouter()

  const { data: status, isLoading } = api.onet.getOccupationStatus.useQuery()

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
    router.push(ROUTES.DASHBOARD.ASSESSMENTS.OCCUPATION.path)
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

        <Button variant="primary" onPress={handleStart} size="$5">
          <Button.Text>Add Occupations</Button.Text>
        </Button>

        <Text fontSize="$2" color="$color11">
          Takes about 1-2 minutes (optional)
        </Text>
      </YStack>
    </DashboardWidget>
  )
}
