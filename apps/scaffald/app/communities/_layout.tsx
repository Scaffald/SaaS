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

export default function CommunitiesSectionLayout() {
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
        section: 'communities',
        userId: user?.id,
      }}
    >
      <DrawerLayout protectionComponent={loadingOverlay} hideDrawer={!statusData?.isComplete}>
        <Drawer.Screen name="index" options={{ title: 'Communities' }} />
        <Drawer.Screen name="connections/index" options={{ title: 'Connections' }} />
        <Drawer.Screen name="bookmarks" options={{ title: 'Bookmarks' }} />
        <Drawer.Screen name="reputation" options={{ title: 'Scaffold Score' }} />
        <Drawer.Screen name="[slug]" options={{ title: 'Community' }} />
      </DrawerLayout>
    </ErrorBoundary>
  )
}
