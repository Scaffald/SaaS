import { useRouter } from 'expo-router'
import { YStack, Text, Button, Spinner } from 'tamagui'
import { DashboardWidget } from '@app/ui'
import { api } from '@app/core/utils/api'
import { ROUTES } from '@app/core/constants/routes'

/**
 * RIASECAssessmentWidget - Dashboard widget CTA for RIASEC Career Interests
 */
export function RIASECAssessmentWidget() {
  const router = useRouter()

  const { data: status, isLoading } = api.onet.getRIASECStatus.useQuery()

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
    router.push(ROUTES.DASHBOARD_ASSESSMENT_RIASEC.path)
  }

  return (
    <DashboardWidget>
      <YStack gap="$4">
        <YStack gap="$2">
          <Text fontSize="$6" fontWeight="bold" color="$color12">
            Career Interests
          </Text>
          <Text fontSize="$3" color="$color11">
            Rate your interest in 6 career dimensions to discover careers that match your interests.
          </Text>
        </YStack>

        <Button onPress={handleStart} size="$5" themeInverse>
          <Button.Text>Start Interest Assessment</Button.Text>
        </Button>

        <Text fontSize="$2" color="$color11">
          Takes about 2-3 minutes
        </Text>
      </YStack>
    </DashboardWidget>
  )
}

