import { ROUTES } from '@scf/core/constants/routes'
import { useProtectedRoute } from '@scf/core/utils/auth/useProtectedRoute'
import { useSessionContext } from '@scf/core/utils/supabase/useSessionContext'
import { usePrerequisitesCheck } from '@scf/core/utils/prerequisites-sdk-hooks'
import { Slot, useRouter, useSegments } from 'expo-router'
import { useEffect, useRef } from 'react'
import { StyleSheet } from 'react-native'
import { Spinner, Text, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

/**
 * Protected Layout — centralized auth gate for all authenticated sections.
 *
 * Guarantees for child routes:
 * - User is authenticated
 * - Session token is available for SDK calls
 * - Prerequisites are complete (except /onboarding, which IS the prereqs flow)
 */
export default function ProtectedLayout() {
  const { isLoading, user } = useProtectedRoute()
  const { session, isLoading: isSessionLoading } = useSessionContext()
  const { theme } = useThemeContext()
  const resolvedTheme = theme === 'dark' ? 'dark' : 'light'
  const router = useRouter()
  const segments = useSegments()
  const hasRedirectedToOnboardingRef = useRef(false)

  // Onboarding is inside (protected) but should NOT check prerequisites
  // because it IS the prerequisite completion flow.
  const isOnboardingRoute = (segments as string[]).includes('onboarding')

  const { data: statusData, isLoading: isCheckingPrereqs } = usePrerequisitesCheck({
    enabled: !!user && !isOnboardingRoute,
  })

  // Redirect to /onboarding when prerequisites incomplete (skip if already on onboarding)
  // biome-ignore lint/correctness/useExhaustiveDependencies: router is stable
  useEffect(() => {
    if (isOnboardingRoute) return
    if (isCheckingPrereqs || !statusData || statusData.isComplete || hasRedirectedToOnboardingRef.current) {
      return
    }
    hasRedirectedToOnboardingRef.current = true
    router.replace(ROUTES.ONBOARDING.path)
  }, [statusData, isCheckingPrereqs, isOnboardingRoute])

  // Wait for session before rendering so SDK has token and API calls don't 401
  const sessionReady = !isSessionLoading && (user ? !!session?.access_token : true)

  // For onboarding, we only need auth + session (no prereqs check)
  const isReady = isOnboardingRoute
    ? !isLoading && sessionReady
    : !isLoading && !isCheckingPrereqs && sessionReady

  if (!isReady) {
    return (
      <Stack
        style={{ ...StyleSheet.absoluteFillObject, backgroundColor: colors.bg[resolvedTheme].default }}
        justify="center"
        align="center"
      >
        <Spinner size="lg" />
        <Text>Loading...</Text>
      </Stack>
    )
  }

  return <Slot />
}
