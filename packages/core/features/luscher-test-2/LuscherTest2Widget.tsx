import { useRouter } from 'expo-router'
import { YStack, Text, Button, Spinner } from 'tamagui'
import { DashboardWidget } from '@app/ui'
import { api } from '@app/core/utils/api'
import { ROUTES } from '@app/core/constants/routes'

/**
 * LuscherTest2Widget - Dashboard widget CTA for Luscher Color Test 2 (Aspirational)
 */
export function LuscherTest2Widget() {
  const router = useRouter()

  const { data: status, isLoading } = api.personalityAssessment.getLuscherTest2Status.useQuery()

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
    router.push(ROUTES.DASHBOARD_ASSESSMENT_LUSCHER_2.path)
  }

  return (
    <DashboardWidget>
      <YStack gap="$4">
        <YStack gap="$2">
          <Text fontSize="$6" fontWeight="bold" color="$color12">
            Aspirational Color Test
          </Text>
          <Text fontSize="$3" color="$color11">
            Select 8 colors again, this time based on your aspirational preferences - the colors you'd like to prefer.
          </Text>
        </YStack>

        <Button onPress={handleStart} size="$5" themeInverse>
          <Button.Text>Start Aspirational Test</Button.Text>
        </Button>

        <Text fontSize="$2" color="$color11">
          Takes about 2-3 minutes
        </Text>
      </YStack>
    </DashboardWidget>
  )
}

