import { ErrorBoundary } from '@scf/core/components/ErrorBoundary'
import { ROUTES } from '@scf/core/constants/routes'
import { DrawerLayout } from '@scf/core/features/drawer/DrawerLayout'
import { useProtectedRoute } from '@scf/core/utils/auth/useProtectedRoute'
import { useSessionContext } from '@scf/core/utils/supabase/useSessionContext'
import { usePrerequisitesCheck } from '@scf/core/utils/prerequisites-sdk-hooks'
import { useRouter } from 'expo-router'
import { Drawer } from 'expo-router/drawer'
import { useEffect, useRef } from 'react'
import { StyleSheet } from 'react-native'
import { Spinner, Text, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

export default function OrgLayout() {
  const { isLoading, user } = useProtectedRoute()
  const { session, isLoading: isSessionLoading } = useSessionContext()
  const { theme } = useThemeContext()
  const resolvedTheme = theme === 'dark' ? 'dark' : 'light'
  const router = useRouter()
  const hasRedirectedToOnboardingRef = useRef(false)

  const { data: statusData, isLoading: isCheckingPrereqs } = usePrerequisitesCheck({
    enabled: !!user,
  })

  useEffect(() => {
    if (isCheckingPrereqs || !statusData || statusData.isComplete || hasRedirectedToOnboardingRef.current) {
      return
    }
    hasRedirectedToOnboardingRef.current = true
    router.replace(ROUTES.ONBOARDING.path)
  }, [statusData, isCheckingPrereqs, router])

  const sessionReady = !isSessionLoading && (user ? !!session?.access_token : true)
  const loadingOverlay =
    isLoading || isCheckingPrereqs || !sessionReady ? (
      <Stack
        style={{ ...StyleSheet.absoluteFillObject, backgroundColor: colors.bg[resolvedTheme].default }}
        justify="center"
        align="center"
      >
        <Spinner size="lg" />
        <Text>Loading...</Text>
      </Stack>
    ) : null

  return (
    <ErrorBoundary
      context={{
        section: 'org',
        userId: user?.id,
      }}
    >
      <DrawerLayout protectionComponent={loadingOverlay} hideDrawer={!statusData?.isComplete}>
        <Drawer.Screen name="index" options={{ title: 'My Organizations' }} />
        <Drawer.Screen name="invitations" options={{ title: 'Invitations' }} />
        <Drawer.Screen name="[slug]/index" options={{ title: 'Organization' }} />
        <Drawer.Screen name="[slug]/teams/index" options={{ title: 'Teams' }} />
        <Drawer.Screen name="[slug]/teams/[teamId]/index" options={{ title: 'Team Detail' }} />
        <Drawer.Screen name="[slug]/logs/index" options={{ title: 'Logs' }} />
        <Drawer.Screen name="[slug]/logs/create" options={{ title: 'New Log' }} />
        <Drawer.Screen name="[slug]/logs/[workLogId]/index" options={{ title: 'Log Detail' }} />
      </DrawerLayout>
    </ErrorBoundary>
  )
}
