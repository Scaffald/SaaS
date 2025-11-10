import { useProtectedRoute } from '@app/core/utils/auth/useProtectedRoute'
import { ErrorBoundary } from '@app/core/components/ErrorBoundary'
import { DrawerLayout } from '@app/core/features/drawer/DrawerLayout'
import { Drawer } from 'expo-router/drawer'
import { YStack, Text, Spinner } from 'tamagui'
import { useRouter } from 'expo-router'
import { usePathname } from '@app/core/utils/usePathname'
import { useEffect } from 'react'
import { api } from '@app/core/utils/api'

export default function Layout() {
  const { isLoading, user } = useProtectedRoute()
  const router = useRouter()
  const pathname = usePathname()

  // Check prerequisites status - only run when we have a valid user
  // This prevents race conditions after DB resets when session is invalid
  const { data: statusData, isLoading: isCheckingPrereqs } = api.prerequisites.check.useQuery(
    undefined,
    {
      enabled: !!user, // Only run if user exists
    }
  )

  // Redirect to /dashboard if prerequisites incomplete and not already there
  useEffect(() => {
    if (!isCheckingPrereqs && statusData && !statusData.isComplete) {
      if (pathname !== '/dashboard' && !pathname?.startsWith('/dashboard/index')) {
        router.replace('/dashboard')
      }
    }
  }, [statusData, isCheckingPrereqs, pathname, router])

  // Show loading state BEFORE rendering the drawer
  if (isLoading || isCheckingPrereqs) {
    return (
      <YStack flex={1} justify="center" items="center">
        <Spinner size="large" />
        <Text mt="$4">Loading...</Text>
      </YStack>
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
        <Drawer.Screen name="discover/map/index" options={{ title: 'Map Search' }} />
        <Drawer.Screen name="discover/workers/index" options={{ title: 'Search Workers' }} />
        <Drawer.Screen name="discover/workers/[id]/index" options={{ title: 'Worker Profile' }} />
        <Drawer.Screen name="discover/employers/index" options={{ title: 'Search Employers' }} />
        <Drawer.Screen name="discover/jobs/index" options={{ title: 'Search Jobs' }} />
        <Drawer.Screen name="users/[id]/index" options={{ title: 'User Profile' }} />
        <Drawer.Screen name="profile/general/index" options={{ title: 'General Information' }} />
        <Drawer.Screen name="profile/education/index" options={{ title: 'Education' }} />
        <Drawer.Screen name="profile/employment/index" options={{ title: 'Employment' }} />
        <Drawer.Screen name="profile/experience/index" options={{ title: 'Experience' }} />
        <Drawer.Screen name="profile/skills/index" options={{ title: 'Skills' }} />
        <Drawer.Screen name="profile/certifications/index" options={{ title: 'Certifications' }} />
        {/* Legacy personality assessment route (backward compatibility) */}
        <Drawer.Screen
          name="assessment/personality/index"
          options={{ title: 'Personality Assessment' }}
        />
        {/* New isolated assessment routes */}
        <Drawer.Screen name="assessments/pulse/index" options={{ title: 'Weekly Pulse' }} />
        <Drawer.Screen name="assessments/ipip/index" options={{ title: 'Personality Questions' }} />
        <Drawer.Screen
          name="assessments/luscher-2/index"
          options={{ title: 'Aspirational Color Test' }}
        />
        <Drawer.Screen name="assessments/riasec/index" options={{ title: 'Career Interests' }} />
        <Drawer.Screen
          name="assessments/occupation/index"
          options={{ title: 'Occupation Preferences' }}
        />
      </DrawerLayout>
    </ErrorBoundary>
  )
}
