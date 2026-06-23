import { ROUTES } from '@scf/core/constants/routes'
import { useProtectedRoute } from '@scf/core/utils/auth/useProtectedRoute'
import { useSessionContext } from '@scf/core/utils/supabase/useSessionContext'
import { usePrerequisitesCheck } from '@scf/core/utils/prerequisites-sdk-hooks'
import { useNotificationDeviceRegistration } from '@scf/core/hooks/useNotificationDeviceRegistration'
import { Slot, useRouter, useSegments } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { Button, Spinner, Text, Stack, useThemeContext, BottomBarProvider } from '@scaffald/ui'
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

  const {
    data: statusData,
    isLoading: isCheckingPrereqs,
    isError: isPrereqsError,
    refetch: refetchPrereqs,
  } = usePrerequisitesCheck({
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

  // Register this device for push once the user is authenticated + session-ready,
  // so application-status / message / job-match notifications can be delivered.
  // The hook no-ops on web and when disabled.
  useNotificationDeviceRegistration(!!user && sessionReady)

  // Resilience: a slow or never-resolving prereqs/session query must not strand
  // the user on an infinite spinner (the failure mode behind the 2026-05-26 audit's
  // "stuck on Loading" findings). After a grace period — or immediately on a hard
  // error — surface a retry path instead.
  const [showRetry, setShowRetry] = useState(false)
  useEffect(() => {
    if (isReady) {
      setShowRetry(false)
      return
    }
    const timer = setTimeout(() => setShowRetry(true), 15000)
    return () => clearTimeout(timer)
  }, [isReady])

  const handleRetry = () => {
    setShowRetry(false)
    refetchPrereqs()
  }

  const overlayStyle = {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.bg[resolvedTheme].default,
  }

  return (
    <BottomBarProvider>
      <View style={{ flex: 1 }}>
        {isReady ? (
          <Slot />
        ) : isPrereqsError || showRetry ? (
          <Stack style={overlayStyle} justify="center" align="center" gap={12}>
            <Text style={{ color: colors.text[resolvedTheme].secondary }}>
              This is taking longer than usual.
            </Text>
            <Button variant="outline" onPress={handleRetry}>
              Retry
            </Button>
          </Stack>
        ) : (
          <Stack style={overlayStyle} justify="center" align="center">
            <Spinner size="lg" />
            <Text>Loading...</Text>
          </Stack>
        )}
      </View>
    </BottomBarProvider>
  )
}
