import { ROUTES } from '@scf/core/constants/routes'
import { api } from '@scf/core/utils/api'
import { useProtectedRoute } from '@scf/core/utils/auth/useProtectedRoute'
import { useRouter } from 'expo-router'
import { Stack } from 'expo-router/stack'
import { useEffect } from 'react'
import { Spinner, Text, Stack } from '@unicornlove/beyond-ui'

export default function OnboardingLayout() {
  const { isLoading, user } = useProtectedRoute()
  const router = useRouter()

  // Check prerequisites status - only run when we have a valid user
  const { data: statusData, isLoading: isCheckingPrereqs } = api.prerequisites.check.useQuery(
    undefined,
    {
      enabled: !!user, // Only run if user exists
    }
  )

  // Redirect to dashboard if prerequisites are already complete
  useEffect(() => {
    if (!isCheckingPrereqs && statusData?.isComplete) {
      router.replace(ROUTES.DASHBOARD.path)
    }
  }, [statusData, isCheckingPrereqs, router])

  // Show loading state while checking auth or prerequisites
  if (isLoading || isCheckingPrereqs) {
    return (
      <Stack flex={1} justifyContent="center" alignItems="center">
        <Spinner size="large" />
        <Text marginTop="$4">Loading...</Text>
      </Stack>
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
