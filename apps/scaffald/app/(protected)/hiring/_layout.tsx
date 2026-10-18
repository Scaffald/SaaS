import { ErrorBoundary } from '@scf/core/components/ErrorBoundary'
import { scrollingScreenLayout } from '@scf/core/components/layouts/ScreenScroll'
import { DrawerLayout } from '@scf/core/features/drawer/DrawerLayout'
import { useUser } from '@scf/core/utils/useUser'
import { Stack } from 'expo-router'

/**
 * The employer's hiring screens: the pipeline, a candidate, their inquiry and
 * the hire (#1312).
 *
 * These lived under (admin)/office, whose layout admits only the platform
 * `office` role — so an organisation's own admin, whom the api already lets
 * work the pipeline, was sent to the dashboard. Here they sit behind the
 * (protected) gate like every other signed-in section, and the api decides
 * whose applications a caller may see: their own organisations', nobody
 * else's.
 *
 * Same navigator and the same scrolling screen layout the Office stack gave
 * them (#796), so the screens render as they did there.
 */
export default function HiringLayout() {
  const { user } = useUser()

  return (
    <ErrorBoundary context={{ section: 'hiring', userId: user?.id }}>
      <DrawerLayout protectionComponent={null} screenLayout={scrollingScreenLayout}>
        <Stack.Screen name="index" options={{ title: 'Applications' }} />
        <Stack.Screen name="applications/index" options={{ title: 'Applications' }} />
        <Stack.Screen name="applications/[applicationId]/index" options={{ title: 'Candidate' }} />
        <Stack.Screen name="applications/[applicationId]/inquiry" options={{ title: 'Inquiry' }} />
        <Stack.Screen name="applications/[applicationId]/hire" options={{ title: 'Hire' }} />
      </DrawerLayout>
    </ErrorBoundary>
  )
}
