import { ErrorBoundary } from '@scf/core/components/ErrorBoundary'
import { DrawerLayout } from '@scf/core/features/drawer/DrawerLayout'
import { useUser } from '@scf/core/utils/useUser'
import { Stack } from 'expo-router'

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
        <Stack.Screen name="index" options={{ title: 'Communities' }} />
        <Stack.Screen name="connections/index" options={{ title: 'Connections' }} />
        <Stack.Screen name="bookmarks" options={{ title: 'Bookmarks' }} />
        <Stack.Screen name="reputation" options={{ title: 'Scaffold Score' }} />
        <Stack.Screen name="[slug]" options={{ title: 'Community' }} />
      </DrawerLayout>
    </ErrorBoundary>
  )
}
