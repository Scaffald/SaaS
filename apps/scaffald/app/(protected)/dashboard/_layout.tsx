import { ErrorBoundary } from '@scf/core/components/ErrorBoundary'
import { DrawerLayout } from '@scf/core/features/drawer/DrawerLayout'
import { useUser } from '@scf/core/utils/useUser'
import { Drawer } from 'expo-router/drawer'

/**
 * Dashboard Layout — Drawer navigation only.
 * Auth, session, and prerequisites are handled by the (protected) group layout.
 */
export default function DashboardLayout() {
  const { user } = useUser()

  return (
    <ErrorBoundary
      context={{
        section: 'dashboard',
        userId: user?.id,
      }}
    >
      <DrawerLayout protectionComponent={null}>
        <Drawer.Screen name="index" options={{ title: 'Dashboard' }} />
        <Drawer.Screen name="jobs/index" options={{ title: 'Search Jobs' }} />
        <Drawer.Screen name="jobs/[id]" options={{ title: 'Job Detail' }} />
        <Drawer.Screen name="jobs/applications/index" options={{ title: 'Applications' }} />
        <Drawer.Screen
          name="jobs/applications/[applicationId]/inquiry"
          options={{ title: 'Inquiry' }}
        />
        <Drawer.Screen name="jobs/my-listings/index" options={{ title: 'My Listings' }} />
        <Drawer.Screen name="users/[id]/index" options={{ title: 'User Profile' }} />
        <Drawer.Screen name="profile" options={{ title: 'Profile' }} />
        <Drawer.Screen name="settings/index" options={{ title: 'Settings' }} />
        <Drawer.Screen name="news/index" options={{ title: 'News' }} />
        <Drawer.Screen name="career-explorer/index" options={{ title: 'Career Explorer' }} />
        <Drawer.Screen name="career-explorer/[onetCode]" options={{ title: 'Occupation Detail' }} />
        <Drawer.Screen name="assessments/index" options={{ title: 'Assessments' }} />
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
        <Drawer.Screen name="analytics/index" options={{ title: 'Analytics' }} />
        <Drawer.Screen name="analytics/engagement" options={{ title: 'Engagement' }} />
        <Drawer.Screen name="analytics/visibility" options={{ title: 'Visibility' }} />
        <Drawer.Screen name="analytics/search" options={{ title: 'Search Analytics' }} />
      </DrawerLayout>
    </ErrorBoundary>
  )
}
