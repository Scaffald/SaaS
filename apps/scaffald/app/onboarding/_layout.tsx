import { ROUTES } from '@scf/core/constants/routes'
import { useProtectedRoute } from '@scf/core/utils/auth/useProtectedRoute'
import { usePrerequisites } from '@scaffald/sdk/react'
import { useRouter } from 'expo-router'
import { Stack } from 'expo-router/stack'
import { useEffect, useRef } from 'react'
import { Button, Spinner, Text, Stack as UIStack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

export default function OnboardingLayout() {
  const { isLoading, user } = useProtectedRoute()
  const router = useRouter()
  const { theme } = useThemeContext()
  const hasRedirectedToDashboardRef = useRef(false)

  // Use same prerequisites hook as app index and dashboard so cache/invalidation is shared
  const { data: statusData, isLoading: isCheckingPrereqs, isError, refetch } = usePrerequisites({
    enabled: !!user,
  })

  // Redirect to dashboard once when prerequisites are already complete (avoids re-running after replace)
  // biome-ignore lint/correctness/useExhaustiveDependencies: router is stable; including it would cause re-runs on route change
  useEffect(() => {
    if (isCheckingPrereqs || !statusData?.isComplete || hasRedirectedToDashboardRef.current) {
      return
    }
    hasRedirectedToDashboardRef.current = true
    router.replace(ROUTES.DASHBOARD.path)
  }, [statusData?.isComplete, isCheckingPrereqs])

  // Show loading state while checking auth or prerequisites
  if (isLoading || isCheckingPrereqs) {
    return (
      <UIStack justify="center" align="center">
        <Spinner size="lg" />
        <Text style={{ color: colors.text[theme].secondary }}>Loading...</Text>
      </UIStack>
    )
  }

  // Show error state with retry when API is unavailable
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

  // Render onboarding screens with minimal layout (no drawer, no navigation)
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
