import { ROUTES } from '@scf/core/constants/routes'
import { useProtectedRoute } from '@scf/core/utils/auth/useProtectedRoute'
import { usePrerequisitesCheck } from '@scf/core/utils/prerequisites-sdk-hooks'
import { useRouter } from 'expo-router'
import { Stack } from 'expo-router/stack'
import { useEffect } from 'react'
import { Spinner, Text, Stack as UIStack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

export default function OnboardingLayout() {
  const { isLoading, user } = useProtectedRoute()
  const router = useRouter()
  const { theme } = useThemeContext()

  // Check prerequisites status - only run when we have a valid user
  const { data: statusData, isLoading: isCheckingPrereqs } = usePrerequisitesCheck({
    enabled: !!user,
  })

  // Redirect to dashboard if prerequisites are already complete
  useEffect(() => {
    if (!isCheckingPrereqs && statusData?.isComplete) {
      router.replace(ROUTES.DASHBOARD.path)
    }
  }, [statusData, isCheckingPrereqs, router])

  // Show loading state while checking auth or prerequisites
  if (isLoading || isCheckingPrereqs) {
    return (
      <UIStack justify="center" align="center">
        <Spinner size="lg" />
        <Text style={{ color: colors.text[theme].secondary }}>Loading...</Text>
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
