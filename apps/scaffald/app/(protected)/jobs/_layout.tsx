import { ErrorBoundary } from '@scf/core/components/ErrorBoundary'
import { DrawerLayout } from '@scf/core/features/drawer/DrawerLayout'
import { useUser } from '@scf/core/utils/useUser'
import { Stack } from 'expo-router'

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
        <Stack.Screen name="index" options={{ title: 'Search Jobs' }} />
        {/* Lives at jobs/view/[id], not jobs/[id]: the public SEO route
            (app/(public)/jobs/[slug].tsx) is also /jobs/<param>, and route
            groups are not part of the URL, so the two collided. The server
            rendered the public page's title and metadata and the client then
            resolved to this one and redirected to /auth (#734). */}
        <Stack.Screen name="view/[id]" options={{ title: 'Job Detail' }} />
        <Stack.Screen name="saved/index" options={{ title: 'Saved Jobs' }} />
        <Stack.Screen name="applications/index" options={{ title: 'Applications' }} />
        <Stack.Screen
          name="applications/[applicationId]/inquiry"
          options={{ title: 'Inquiry' }}
        />
        <Stack.Screen
          name="applications/[applicationId]/index"
          options={{ title: 'Application Detail' }}
        />
        <Stack.Screen
          name="applications/[applicationId]/messages"
          options={{ title: 'Messages' }}
        />
        <Stack.Screen name="my-listings/index" options={{ title: 'My Listings' }} />
      </DrawerLayout>
    </ErrorBoundary>
  )
}
