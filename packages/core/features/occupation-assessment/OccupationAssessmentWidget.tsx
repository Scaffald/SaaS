import { useRouter } from 'expo-router'
import { YStack, Text, Button, Spinner } from 'tamagui'
import { DashboardWidget } from '@app/ui'
import { api } from '@app/core/utils/api'
import { ROUTES } from '@app/core/constants/routes'

/**
 * OccupationAssessmentWidget - Dashboard widget CTA for Occupation Preferences
 */
export function OccupationAssessmentWidget() {
  const router = useRouter()

  const { data: status, isLoading } = api.onet.getOccupationStatus.useQuery()

  if (isLoading) {
    return (
      <DashboardWidget>
        <YStack gap="$3" items="center" py="$8">
          <Spinner size="large" />
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
      <YStack gap="$4">
        <YStack gap="$2">
          <Text fontSize="$6" fontWeight="bold" color="$color12">
            Occupation Preferences
          </Text>
          <Text fontSize="$3" color="$color11">
            Tell us about your current occupation and target occupations to help us recommend relevant opportunities.
          </Text>
        </YStack>

        <Button onPress={handleStart} size="$5" themeInverse>
          <Button.Text>Add Occupations</Button.Text>
        </Button>

        <Text fontSize="$2" color="$color11">
          Takes about 1-2 minutes (optional)
        </Text>
      </YStack>
    </DashboardWidget>
  )
}

