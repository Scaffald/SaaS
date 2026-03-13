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

export default function Layout() {
  const { isLoading, user } = useProtectedRoute()
  const { session, isLoading: isSessionLoading } = useSessionContext()
  const { theme } = useThemeContext()
  const router = useRouter()
  const hasRedirectedToOnboardingRef = useRef(false)

  // Check prerequisites status - only run when we have a valid user
  // This prevents race conditions after DB resets when session is invalid
  const { data: statusData, isLoading: isCheckingPrereqs } = usePrerequisitesCheck({
    enabled: !!user, // Only run if user exists
  })

  // Redirect to /onboarding once when prerequisites incomplete (avoids loop / double replace)
  // biome-ignore lint/correctness/useExhaustiveDependencies: router is stable; deps would cause re-runs on every route change
  useEffect(() => {
    if (isCheckingPrereqs || !statusData || statusData.isComplete || hasRedirectedToOnboardingRef.current) {
      return
    }
    hasRedirectedToOnboardingRef.current = true
    router.replace(ROUTES.ONBOARDING.path)
  }, [statusData, isCheckingPrereqs])

  // Wait for session before rendering drawer so SDK has token and API calls don't 401
  const sessionReady = !isSessionLoading && (user ? !!session?.access_token : true)

  // Show loading overlay while auth/session/prereqs are pending.
  // Keep DrawerLayout always mounted so the Drawer navigator never remounts — remounting
  // fires all Drawer.Screen navigation effects simultaneously, causing the
  // "Maximum update depth exceeded" crash.
  const loadingOverlay =
    isLoading || isCheckingPrereqs || !sessionReady ? (
      <Stack
        style={{ ...StyleSheet.absoluteFillObject, backgroundColor: colors.bg[theme].default }}
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
        section: 'dashboard',
        userId: user?.id,
      }}
    >
      <DrawerLayout protectionComponent={loadingOverlay} hideDrawer={!statusData?.isComplete}>
        <Drawer.Screen name="index" options={{ title: 'Dashboard' }} />
        <Drawer.Screen name="map/index" options={{ title: 'Map Search' }} />
        <Drawer.Screen name="workers/index" options={{ title: 'Search Workers' }} />
        <Drawer.Screen name="workers/[id]/index" options={{ title: 'Worker Profile' }} />
        <Drawer.Screen name="employers/index" options={{ title: 'Search Employers' }} />
        <Drawer.Screen name="employers/[id]/index" options={{ title: 'Employer Profile' }} />
        <Drawer.Screen name="jobs/index" options={{ title: 'Search Jobs' }} />
        <Drawer.Screen name="users/[id]/index" options={{ title: 'User Profile' }} />
        <Drawer.Screen name="profile" options={{ title: 'Profile' }} />
        <Drawer.Screen name="assessments/pulse/index" options={{ title: 'Weekly Pulse' }} />
        <Drawer.Screen
          name="assessments/ipip/index"
          options={{ title: 'Personality Assessment' }}
        />
        <Drawer.Screen name="assessments/riasec/index" options={{ title: 'Career Interests' }} />
        <Drawer.Screen
          name="assessments/occupation/index"
          options={{ title: 'Occupation Preferences' }}
        />
        <Drawer.Screen
          name="skills-analytics/index"
          options={{ title: 'Skills Analytics' }}
        />
        <Drawer.Screen name="work-logs/index" options={{ title: 'Work Logs' }} />
        <Drawer.Screen name="work-logs/create" options={{ title: 'New Work Log' }} />
        <Drawer.Screen name="work-logs/[workLogId]/index" options={{ title: 'Work Log Detail' }} />
        <Drawer.Screen name="communities/index" options={{ title: 'Communities' }} />
        <Drawer.Screen name="communities/bookmarks" options={{ title: 'Bookmarks' }} />
        <Drawer.Screen name="communities/reputation" options={{ title: 'Scaffold Score' }} />
      </DrawerLayout>
    </ErrorBoundary>
  )
}
