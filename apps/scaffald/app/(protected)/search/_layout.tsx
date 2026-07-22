import { ErrorBoundary } from '@scf/core/components/ErrorBoundary'
import { DrawerLayout } from '@scf/core/features/drawer/DrawerLayout'
import { useUser } from '@scf/core/utils/useUser'
import { Stack } from 'expo-router'

/**
 * Search Layout — Drawer navigation only, matching the other sections.
 * Previously /search was a bare route in (protected) with no section layout,
 * so it rendered without the app header or tab bar (#381).
 */
export default function SearchLayout() {
  const { user } = useUser()

  return (
    <ErrorBoundary
      context={{
        section: 'search',
        userId: user?.id,
      }}
    >
      <DrawerLayout protectionComponent={null}>
        <Stack.Screen name="index" options={{ title: 'Search' }} />
      </DrawerLayout>
    </ErrorBoundary>
  )
}
