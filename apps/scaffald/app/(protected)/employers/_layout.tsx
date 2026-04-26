import { ErrorBoundary } from '@scf/core/components/ErrorBoundary'
import { DrawerLayout } from '@scf/core/features/drawer/DrawerLayout'
import { useUser } from '@scf/core/utils/useUser'
import { Stack } from 'expo-router'

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
        <Stack.Screen name="index" options={{ title: 'Search Employers' }} />
        <Stack.Screen name="[id]/index" options={{ title: 'Employer Profile' }} />
        <Stack.Screen name="create" options={{ title: 'Create Employer' }} />
        <Stack.Screen name="invitations" options={{ title: 'Invitations' }} />
        <Stack.Screen name="org/index" options={{ title: 'My Organizations' }} />
        <Stack.Screen name="org/[slug]/index" options={{ title: 'Organization' }} />
        <Stack.Screen name="org/[slug]/teams/index" options={{ title: 'Teams' }} />
        <Stack.Screen
          name="org/[slug]/teams/[teamId]/index"
          options={{ title: 'Team Detail' }}
        />
        <Stack.Screen name="org/[slug]/logs/index" options={{ title: 'Logs' }} />
        <Stack.Screen name="org/[slug]/logs/create" options={{ title: 'New Log' }} />
        <Stack.Screen
          name="org/[slug]/logs/[workLogId]/index"
          options={{ title: 'Log Detail' }}
        />
        <Stack.Screen name="teams/index" options={{ title: 'Teams' }} />
        <Stack.Screen name="teams/invitations" options={{ title: 'Team Invitations' }} />
        <Stack.Screen name="teams/[id]/index" options={{ title: 'Team Detail' }} />
        <Stack.Screen name="logs/index" options={{ title: 'Work Logs' }} />
        <Stack.Screen name="logs/create" options={{ title: 'New Work Log' }} />
        <Stack.Screen name="logs/[workLogId]/index" options={{ title: 'Work Log Detail' }} />
        <Stack.Screen name="organizations/index" options={{ title: 'Organizations' }} />
        <Stack.Screen name="organizations/create" options={{ title: 'Create Organization' }} />
      </DrawerLayout>
    </ErrorBoundary>
  )
}
