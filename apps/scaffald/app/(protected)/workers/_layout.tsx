import { ErrorBoundary } from '@scf/core/components/ErrorBoundary'
import { DrawerLayout } from '@scf/core/features/drawer/DrawerLayout'
import { useUser } from '@scf/core/utils/useUser'
import { Drawer } from 'expo-router/drawer'

/**
 * Workers Layout — Drawer navigation only.
 * Auth, session, and prerequisites are handled by the (protected) group layout.
 */
export default function WorkersLayout() {
  const { user } = useUser()

  return (
    <ErrorBoundary
      context={{
        section: 'workers',
        userId: user?.id,
      }}
    >
      <DrawerLayout protectionComponent={null}>
        <Drawer.Screen name="index" options={{ title: 'Search Workers' }} />
        <Drawer.Screen name="[id]/index" options={{ title: 'Worker Profile' }} />
        <Drawer.Screen name="map/index" options={{ title: 'Map Search' }} />
      </DrawerLayout>
    </ErrorBoundary>
  )
}
