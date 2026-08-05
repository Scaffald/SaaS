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
 * - Prerequisites are complete (except /onboarding, which IS the prereqs flow,
 *   and /legal-update, which IS the legal re-acceptance flow)
 *
 * The <Slot /> must stay mounted even while these checks are pending.
 * Returning a loading view *instead of* the navigator unmounts it during web
 * hydration, so react-navigation resolves the focused route back to the
 * group's initial route and expo-router's history sync rewrites the URL —
 * destroying deep-link paths and query params. Same bug class as the OAuth
 * callback-hash loss fixed in (auth)/auth/_layout.tsx. The loading/retry
 * states render as an OPAQUE overlay on top instead, which also closes the
 * old one-frame flash of protected content between isReady and the redirect
 * effect firing.
 */
export default function ProtectedLayout() {
  const { isLoading, user } = useProtectedRoute()
  const { session, isLoading: isSessionLoading } = useSessionContext()
  const { theme } = useThemeContext()
  const resolvedTheme = theme === 'dark' ? 'dark' : 'light'
  const router = useRouter()
  const segments = useSegments()
  // Target-aware (not one-shot): a user can legitimately move between gate
  // targets (finish onboarding while a newer terms version is stale → next
  // redirect goes to /legal-update). Re-redirects to the SAME target are
  // still suppressed so stale query data can't bounce the user around.
  const lastRedirectTargetRef = useRef<string | null>(null)

  // Onboarding and legal-update are inside (protected) but must NOT be
  // redirected away from — they ARE the flows that resolve incompleteness.
  const isOnboardingRoute = (segments as string[]).includes('onboarding')
  const isLegalUpdateRoute = (segments as string[]).includes('legal-update')

  const {
    data: statusData,
    isLoading: isCheckingPrereqs,
    isFetching: isFetchingPrereqs,
    isError: isPrereqsError,
    refetch: refetchPrereqs,
  } = usePrerequisitesCheck({
    // legal-update needs the data (it renders the stale-document list).
    enabled: !!user && !isOnboardingRoute,
  })

  // Redirect incomplete users to the flow that resolves their gap:
  // profile fields missing → /onboarding; legal stale → /legal-update.
  // Gated on isFetching so a stale cache entry mid-invalidation can't bounce
  // a user who just completed a flow.
  // biome-ignore lint/correctness/useExhaustiveDependencies: router is stable
  useEffect(() => {
    if (isOnboardingRoute || isLegalUpdateRoute) return
    if (isCheckingPrereqs || isFetchingPrereqs || !statusData || statusData.isComplete) {
      return
    }
    const target = statusData.needsOnboarding
      ? ROUTES.ONBOARDING.path
      : ROUTES.LEGAL_UPDATE.path
    if (lastRedirectTargetRef.current === target) return
    lastRedirectTargetRef.current = target
    router.replace(target)
  }, [statusData, isCheckingPrereqs, isFetchingPrereqs, isOnboardingRoute, isLegalUpdateRoute])

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

  // Keep covering the content while an off-this-route incompleteness redirect
  // is pending, so protected content never flashes for a gated user.
  const redirectPending = !isOnboardingRoute &&
    !isLegalUpdateRoute &&
    !!statusData &&
    !statusData.isComplete

  const showOverlay = !isReady || redirectPending

  const overlayStyle = {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.bg[resolvedTheme].default,
  }

  return (
    <BottomBarProvider>
      <View style={{ flex: 1 }}>
        <Slot />
        {showOverlay &&
          (isPrereqsError || showRetry ? (
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
          ))}
      </View>
    </BottomBarProvider>
  )
}
