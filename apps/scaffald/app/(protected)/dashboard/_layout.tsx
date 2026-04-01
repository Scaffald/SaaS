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
        <Drawer.Screen name="users/[id]/index" options={{ title: 'User Profile' }} />
        <Drawer.Screen name="settings/index" options={{ title: 'Settings' }} />
        <Drawer.Screen name="news/index" options={{ title: 'News' }} />
        <Drawer.Screen name="notifications/index" options={{ title: 'Notifications' }} />
        <Drawer.Screen name="analytics/index" options={{ title: 'Analytics' }} />
        <Drawer.Screen name="analytics/engagement" options={{ title: 'Engagement' }} />
        <Drawer.Screen name="analytics/visibility" options={{ title: 'Visibility' }} />
        <Drawer.Screen name="analytics/search" options={{ title: 'Search Analytics' }} />
      </DrawerLayout>
    </ErrorBoundary>
  )
}
