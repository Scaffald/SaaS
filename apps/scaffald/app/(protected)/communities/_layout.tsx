import { ErrorBoundary } from '@scf/core/components/ErrorBoundary'
import { DrawerLayout } from '@scf/core/features/drawer/DrawerLayout'
import { useUser } from '@scf/core/utils/useUser'
import { Drawer } from 'expo-router/drawer'

/**
 * Communities Layout — Drawer navigation only.
 * Auth, session, and prerequisites are handled by the (protected) group layout.
 */
export default function CommunitiesSectionLayout() {
  const { user } = useUser()

  return (
    <ErrorBoundary
      context={{
        section: 'communities',
        userId: user?.id,
      }}
    >
      <DrawerLayout protectionComponent={null}>
        <Drawer.Screen name="index" options={{ title: 'Communities' }} />
        <Drawer.Screen name="connections/index" options={{ title: 'Connections' }} />
        <Drawer.Screen name="bookmarks" options={{ title: 'Bookmarks' }} />
        <Drawer.Screen name="reputation" options={{ title: 'Scaffold Score' }} />
        <Drawer.Screen name="[slug]" options={{ title: 'Community' }} />
      </DrawerLayout>
    </ErrorBoundary>
  )
}
