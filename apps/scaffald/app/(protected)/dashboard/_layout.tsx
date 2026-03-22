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
        <Drawer.Screen name="map/index" options={{ title: 'Map Search' }} />
        <Drawer.Screen name="workers/index" options={{ title: 'Search Workers' }} />
        <Drawer.Screen name="workers/[id]/index" options={{ title: 'Worker Profile' }} />
        <Drawer.Screen name="employers/index" options={{ title: 'Search Employers' }} />
        <Drawer.Screen name="employers/[id]/index" options={{ title: 'Employer Profile' }} />
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
        <Drawer.Screen name="employers/create" options={{ title: 'Create Employer' }} />
        <Drawer.Screen name="employers/invitations" options={{ title: 'Invitations' }} />
        <Drawer.Screen name="employers/org/index" options={{ title: 'My Organizations' }} />
        <Drawer.Screen name="employers/org/[slug]/index" options={{ title: 'Organization' }} />
        <Drawer.Screen name="employers/org/[slug]/teams/index" options={{ title: 'Teams' }} />
        <Drawer.Screen
          name="employers/org/[slug]/teams/[teamId]/index"
          options={{ title: 'Team Detail' }}
        />
        <Drawer.Screen name="employers/org/[slug]/logs/index" options={{ title: 'Logs' }} />
        <Drawer.Screen name="employers/org/[slug]/logs/create" options={{ title: 'New Log' }} />
        <Drawer.Screen
          name="employers/org/[slug]/logs/[workLogId]/index"
          options={{ title: 'Log Detail' }}
        />
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
        <Drawer.Screen name="teams/index" options={{ title: 'Teams' }} />
        <Drawer.Screen name="teams/invitations" options={{ title: 'Team Invitations' }} />
        <Drawer.Screen name="work-logs/index" options={{ title: 'Work Logs' }} />
        <Drawer.Screen name="work-logs/create" options={{ title: 'New Work Log' }} />
        <Drawer.Screen name="work-logs/[workLogId]/index" options={{ title: 'Work Log Detail' }} />
        <Drawer.Screen name="analytics/index" options={{ title: 'Analytics' }} />
        <Drawer.Screen name="analytics/engagement" options={{ title: 'Engagement' }} />
        <Drawer.Screen name="analytics/visibility" options={{ title: 'Visibility' }} />
        <Drawer.Screen name="analytics/search" options={{ title: 'Search Analytics' }} />
      </DrawerLayout>
    </ErrorBoundary>
  )
}
