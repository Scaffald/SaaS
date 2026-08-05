import { ROUTES } from '@scf/core/constants/routes'
import { useProtectedRoute } from '@scf/core/utils/auth/useProtectedRoute'
import { useSessionContext } from '@scf/core/utils/supabase/useSessionContext'
import { usePrerequisitesCheck } from '@scf/core/utils/prerequisites-sdk-hooks'
import { Slot, useRouter } from 'expo-router'
import { useEffect, useRef } from 'react'
import { StyleSheet, View } from 'react-native'
import { Spinner, Text, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

/**
 * Admin Layout — authenticated + prerequisites + per-section role checks.
 *
 * Shared auth gate for admin sections (office, developers, oauth).
 * Each section's own _layout.tsx adds its specific role check via useRoleProtectedRoute.
 *
 * The <Slot /> stays mounted with an opaque loading overlay on top — an
 * unmounted navigator during web hydration makes expo-router rewrite the URL
 * to the group's initial route, destroying deep-link paths/params (same bug
 * class as the OAuth callback-hash loss; see (protected)/_layout.tsx).
 */
export default function AdminLayout() {
  const { isLoading, user } = useProtectedRoute()
  const { session, isLoading: isSessionLoading } = useSessionContext()
  const { theme } = useThemeContext()
  const resolvedTheme = theme === 'dark' ? 'dark' : 'light'
  const router = useRouter()
  // Target-aware, not one-shot — see (protected)/_layout.tsx for rationale.
  const lastRedirectTargetRef = useRef<string | null>(null)

  const {
    data: statusData,
    isLoading: isCheckingPrereqs,
    isFetching: isFetchingPrereqs,
  } = usePrerequisitesCheck({
    enabled: !!user,
  })

  // biome-ignore lint/correctness/useExhaustiveDependencies: router is stable
  useEffect(() => {
    if (isCheckingPrereqs || isFetchingPrereqs || !statusData || statusData.isComplete) {
      return
    }
    const target = statusData.needsOnboarding
      ? ROUTES.ONBOARDING.path
      : ROUTES.LEGAL_UPDATE.path
    if (lastRedirectTargetRef.current === target) return
    lastRedirectTargetRef.current = target
    router.replace(target)
  }, [statusData, isCheckingPrereqs, isFetchingPrereqs])

  const sessionReady = !isSessionLoading && (user ? !!session?.access_token : true)

  const redirectPending = !!statusData && !statusData.isComplete
  const showOverlay = isLoading || isCheckingPrereqs || !sessionReady || redirectPending

  return (
    <View style={{ flex: 1 }}>
      <Slot />
      {showOverlay && (
        <Stack
          style={{ ...StyleSheet.absoluteFill, backgroundColor: colors.bg[resolvedTheme].default }}
          justify="center"
          align="center"
        >
          <Spinner size="lg" />
          <Text>Loading...</Text>
        </Stack>
      )}
    </View>
  )
}
