import { ROUTES } from '@scf/core/constants/routes'
import { useProtectedRoute } from '@scf/core/utils/auth/useProtectedRoute'
import { useSessionContext } from '@scf/core/utils/supabase/useSessionContext'
import { usePrerequisitesCheck } from '@scf/core/utils/prerequisites-sdk-hooks'
import { Slot, useRouter } from 'expo-router'
import { useEffect, useRef } from 'react'
import { StyleSheet } from 'react-native'
import { Spinner, Text, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

/**
 * Admin Layout — authenticated + prerequisites + per-section role checks.
 *
 * Shared auth gate for admin sections (office, developers, oauth).
 * Each section's own _layout.tsx adds its specific role check via useRoleProtectedRoute.
 */
export default function AdminLayout() {
  const { isLoading, user } = useProtectedRoute()
  const { session, isLoading: isSessionLoading } = useSessionContext()
  const { theme } = useThemeContext()
  const resolvedTheme = theme === 'dark' ? 'dark' : 'light'
  const router = useRouter()
  const hasRedirectedToOnboardingRef = useRef(false)

  const { data: statusData, isLoading: isCheckingPrereqs } = usePrerequisitesCheck({
    enabled: !!user,
  })

  // biome-ignore lint/correctness/useExhaustiveDependencies: router is stable
  useEffect(() => {
    if (isCheckingPrereqs || !statusData || statusData.isComplete || hasRedirectedToOnboardingRef.current) {
      return
    }
    hasRedirectedToOnboardingRef.current = true
    router.replace(ROUTES.ONBOARDING.path)
  }, [statusData, isCheckingPrereqs])

  const sessionReady = !isSessionLoading && (user ? !!session?.access_token : true)

  if (isLoading || isCheckingPrereqs || !sessionReady) {
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
