import { useRouter } from 'expo-router'
import { YStack, Text, Spinner } from 'tamagui'
import { DashboardWidget, UIButton as StyledButton, spacing } from '@app/ui'
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
    router.push(ROUTES.DASHBOARD_ASSESSMENT_LUSCHER_2.path)
  }

  return (
    <DashboardWidget>
      <YStack gap={spacing.md}>
        <YStack gap={spacing.xs}>
          <Text fontSize="$6" fontWeight="bold" color="$color12">
            Aspirational Color Test
          </Text>
          <Text fontSize="$3" color="$color11">
            Select 8 colors again, this time based on your aspirational preferences - the colors
            you'd like to prefer.
          </Text>
        </YStack>

        <StyledButton variant="primary" onPress={handleStart} size="$5">
          <StyledButton.Text>Start Aspirational Test</StyledButton.Text>
        </StyledButton>

        <Text fontSize="$2" color="$color11">
          Takes about 2-3 minutes
        </Text>
      </YStack>
    </DashboardWidget>
  )
}
