import { ErrorBoundary } from '@scf/core/components/ErrorBoundary'
import { DrawerLayout } from '@scf/core/features/drawer/DrawerLayout'
import { useUser } from '@scf/core/utils/useUser'
import { Stack } from 'expo-router'

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
        <Stack.Screen name="index" options={{ title: 'Dashboard' }} />
        <Stack.Screen name="users/[id]/index" options={{ title: 'User Profile' }} />
        <Stack.Screen name="settings/index" options={{ title: 'Settings' }} />
        <Stack.Screen name="news/index" options={{ title: 'News' }} />
        <Stack.Screen name="notifications/index" options={{ title: 'Notifications' }} />
        <Stack.Screen name="analytics/index" options={{ title: 'Analytics' }} />
        <Stack.Screen name="analytics/engagement" options={{ title: 'Engagement' }} />
        <Stack.Screen name="analytics/visibility" options={{ title: 'Visibility' }} />
        <Stack.Screen name="analytics/search" options={{ title: 'Search Analytics' }} />
      </DrawerLayout>
    </ErrorBoundary>
  )
}
