import { useRouter } from 'expo-router'
import { YStack, Text, Button, Spinner } from 'tamagui'
import { DashboardWidget, Button as StyledButton, spacing } from '@app/ui'
import { api } from '@app/core/utils/api'
import { ROUTES } from '@app/core/constants/routes'

/**
 * LuscherTest1Widget - Dashboard widget CTA for Lüscher Color Test
 * Shows availability status and cooldown information
 */
export function LuscherTest1Widget() {
  const router = useRouter()

  // Get test availability
  const { data: availability, isLoading } =
    api.personalityAssessment.getLuscherTestAvailability.useQuery()

  if (isLoading) {
    return (
      <DashboardWidget>
        <YStack gap={spacing.sm} items="center" py={spacing['2xl']}>
          <Spinner size="large" color="$teal7" />
          <Text color="$color11">Loading...</Text>
        </YStack>
      </DashboardWidget>
    )
  }

  const handleStart = () => {
    router.push(ROUTES.DASHBOARD_ASSESSMENT_LUSCHER_1.path)
  }

  // Calculate days until available
  const getDaysUntilAvailable = () => {
    if (!availability?.nextAvailableAt || !availability.isOnCooldown) return null

    const now = new Date().getTime()
    const availableAt = new Date(availability.nextAvailableAt).getTime()
    const diff = availableAt - now
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))

    return days
  }

  const daysUntilAvailable = getDaysUntilAvailable()

  return (
    <DashboardWidget>
      <YStack gap={spacing.md}>
        {availability?.isOnCooldown && daysUntilAvailable ? (
          <YStack gap={spacing.xs}>
            <Text fontSize="$4" color="$color11">
              Test available in {daysUntilAvailable} day{daysUntilAvailable > 1 ? 's' : ''}
            </Text>
            <Text fontSize="$2" color="$color10">
              This test can be taken once every 7 days
            </Text>
          </YStack>
        ) : (
          <>
            <StyledButton variant="primary" onPress={handleStart} size="$5">
              <Button.Text>Begin Test</Button.Text>
            </StyledButton>
            <Text fontSize="$2" color="$color11">
              Weekly assessment • 2-3 minutes
            </Text>
          </>
        )}
      </YStack>
    </DashboardWidget>
  )
}
