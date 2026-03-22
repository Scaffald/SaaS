import { ErrorBoundary } from '@scf/core/components/ErrorBoundary'
import { DrawerLayout } from '@scf/core/features/drawer/DrawerLayout'
import { useUser } from '@scf/core/utils/useUser'
import { Drawer } from 'expo-router/drawer'

/**
 * Employers Layout — Drawer navigation only.
 * Auth, session, and prerequisites are handled by the (protected) group layout.
 * Includes employers, organizations, teams, and logs (work logs).
 */
export default function EmployersLayout() {
  const { user } = useUser()

  return (
    <ErrorBoundary
      context={{
        section: 'employers',
        userId: user?.id,
      }}
    >
      <DrawerLayout protectionComponent={null}>
        <Drawer.Screen name="index" options={{ title: 'Search Employers' }} />
        <Drawer.Screen name="[id]/index" options={{ title: 'Employer Profile' }} />
        <Drawer.Screen name="create" options={{ title: 'Create Employer' }} />
        <Drawer.Screen name="invitations" options={{ title: 'Invitations' }} />
        <Drawer.Screen name="org/index" options={{ title: 'My Organizations' }} />
        <Drawer.Screen name="org/[slug]/index" options={{ title: 'Organization' }} />
        <Drawer.Screen name="org/[slug]/teams/index" options={{ title: 'Teams' }} />
        <Drawer.Screen
          name="org/[slug]/teams/[teamId]/index"
          options={{ title: 'Team Detail' }}
        />
        <Drawer.Screen name="org/[slug]/logs/index" options={{ title: 'Logs' }} />
        <Drawer.Screen name="org/[slug]/logs/create" options={{ title: 'New Log' }} />
        <Drawer.Screen
          name="org/[slug]/logs/[workLogId]/index"
          options={{ title: 'Log Detail' }}
        />
        <Drawer.Screen name="teams/index" options={{ title: 'Teams' }} />
        <Drawer.Screen name="teams/invitations" options={{ title: 'Team Invitations' }} />
        <Drawer.Screen name="teams/[id]/index" options={{ title: 'Team Detail' }} />
        <Drawer.Screen name="logs/index" options={{ title: 'Work Logs' }} />
        <Drawer.Screen name="logs/create" options={{ title: 'New Work Log' }} />
        <Drawer.Screen name="logs/[workLogId]/index" options={{ title: 'Work Log Detail' }} />
        <Drawer.Screen name="organizations/index" options={{ title: 'Organizations' }} />
        <Drawer.Screen name="organizations/create" options={{ title: 'Create Organization' }} />
      </DrawerLayout>
    </ErrorBoundary>
  )
}
