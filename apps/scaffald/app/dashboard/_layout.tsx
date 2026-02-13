import { ErrorBoundary } from '@scf/core/components/ErrorBoundary'
import { ROUTES } from '@scf/core/constants/routes'
import { DrawerLayout } from '@scf/core/features/drawer/DrawerLayout'
import { useProtectedRoute } from '@scf/core/utils/auth/useProtectedRoute'
import { usePrerequisites } from '@scaffald/sdk/react'
import { useRouter } from 'expo-router'
import { Drawer } from 'expo-router/drawer'
import { useEffect } from 'react'
import { Spinner, Text, Stack } from '@unicornlove/beyond-ui'

export default function Layout() {
  const { isLoading, user } = useProtectedRoute()
  const router = useRouter()

  // Check prerequisites status - only run when we have a valid user
  // This prevents race conditions after DB resets when session is invalid
  const { data: statusData, isLoading: isCheckingPrereqs } = usePrerequisites({
    enabled: !!user, // Only run if user exists
  })

  // Redirect to /onboarding if prerequisites incomplete
  useEffect(() => {
    if (!isCheckingPrereqs && statusData && !statusData.isComplete) {
      router.replace(ROUTES.ONBOARDING.path)
    }
  }, [statusData, isCheckingPrereqs, router])

  // Show loading state BEFORE rendering the drawer
  if (isLoading || isCheckingPrereqs) {
    return (
      <Stack flex={1} justify="center" align="center">
        <Spinner size="lg" />
        <Text>Loading...</Text>
      </Stack>
    )
  }

  // Only render drawer once auth is confirmed
  return (
    <ErrorBoundary
      context={{
        section: 'dashboard',
        userId: user?.id,
      }}
    >
      <DrawerLayout protectionComponent={null} hideDrawer={!statusData?.isComplete}>
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
        <Drawer.Screen name="work-logs/index" options={{ title: 'Work Logs' }} />
        <Drawer.Screen name="work-logs/create" options={{ title: 'New Work Log' }} />
        <Drawer.Screen name="work-logs/[workLogId]/index" options={{ title: 'Work Log Detail' }} />
      </DrawerLayout>
    </ErrorBoundary>
  )
}
