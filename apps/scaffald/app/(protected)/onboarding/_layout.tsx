import { ROUTES } from '@scf/core/constants/routes'
import { usePrerequisitesCheck } from '@scf/core/utils/prerequisites-sdk-hooks'
import { useUser } from '@scf/core/utils/useUser'
import { useRouter } from 'expo-router'
import { Stack } from 'expo-router/stack'
import { useEffect, useRef } from 'react'
import { Button, Spinner, Text, Stack as UIStack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

/**
 * Onboarding Layout — prerequisite completion flow.
 * Auth and session are handled by the (protected) group layout.
 * This layout only checks if prerequisites are already complete (redirect to dashboard if so).
 */
export default function OnboardingLayout() {
  const { user } = useUser()
  const router = useRouter()
  const { theme } = useThemeContext()
  const hasRedirectedToDashboardRef = useRef(false)

  const { data: statusData, isLoading: isCheckingPrereqs, isError, refetch } = usePrerequisitesCheck({
    enabled: !!user,
  })

  // Redirect to dashboard once when prerequisites are already complete
  // biome-ignore lint/correctness/useExhaustiveDependencies: router is stable
  useEffect(() => {
    if (isCheckingPrereqs || !statusData?.isComplete || hasRedirectedToDashboardRef.current) {
      return
    }
    hasRedirectedToDashboardRef.current = true
    router.replace(ROUTES.DASHBOARD.path)
  }, [statusData?.isComplete, isCheckingPrereqs])

  if (isCheckingPrereqs) {
    return (
      <UIStack justify="center" align="center">
        <Spinner size="lg" />
        <Text style={{ color: colors.text[theme].secondary }}>Loading...</Text>
      </UIStack>
    )
  }

  if (isError) {
    return (
      <UIStack justify="center" align="center" gap={12}>
        <Text style={{ color: colors.text[theme].secondary }}>
          Unable to load. Please try again.
        </Text>
        <Button variant="outline" onPress={() => refetch()}>
          Retry
        </Button>
      </UIStack>
    )
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  )
}
