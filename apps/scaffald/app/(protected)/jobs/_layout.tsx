import { ErrorBoundary } from '@scf/core/components/ErrorBoundary'
import { DrawerLayout } from '@scf/core/features/drawer/DrawerLayout'
import { useUser } from '@scf/core/utils/useUser'
import { Drawer } from 'expo-router/drawer'

/**
 * Jobs Layout — Drawer navigation only.
 * Auth, session, and prerequisites are handled by the (protected) group layout.
 */
export default function JobsLayout() {
  const { user } = useUser()

  return (
    <ErrorBoundary
      context={{
        section: 'jobs',
        userId: user?.id,
      }}
    >
      <DrawerLayout protectionComponent={null}>
        <Drawer.Screen name="index" options={{ title: 'Search Jobs' }} />
        <Drawer.Screen name="[id]" options={{ title: 'Job Detail' }} />
        <Drawer.Screen name="applications/index" options={{ title: 'Applications' }} />
        <Drawer.Screen
          name="applications/[applicationId]/inquiry"
          options={{ title: 'Inquiry' }}
        />
        <Drawer.Screen name="my-listings/index" options={{ title: 'My Listings' }} />
      </DrawerLayout>
    </ErrorBoundary>
  )
}
