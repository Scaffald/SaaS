import { useRoleProtectedRoute } from '@app/core/utils/auth/useRoleProtectedRoute'
import { useOfficeRouteProtection } from '@app/core/utils/auth/useOfficeRouteProtection'
import { ErrorBoundary } from '@app/core/components/ErrorBoundary'
import { DrawerLayout } from '@app/core/features/drawer/DrawerLayout'
import { Drawer } from 'expo-router/drawer'
import { YStack, Text, Spinner } from 'tamagui'

export default function OfficeLayout() {
  const { isAuthorized, isLoading } = useRoleProtectedRoute(['office'])
  const { isTabletOrAbove } = useOfficeRouteProtection()

  // Show loading state BEFORE rendering the drawer
  if (isLoading) {
    return (
      <YStack flex={1} justify="center" items="center">
        <Spinner size="large" />
        <Text mt="$4">Loading...</Text>
      </YStack>
    )
  }

  // If not authorized, the hook will handle redirect
  if (!isAuthorized) {
    return null
  }

  // If on mobile, useOfficeRouteProtection will handle redirect
  // This check prevents flash of content before redirect
  if (!isTabletOrAbove) {
    return null
  }

  // Only render drawer once auth is confirmed AND on tablet+
  return (
    <ErrorBoundary
      context={{
        section: 'office',
        requiredRoles: ['office'],
      }}
    >
      <DrawerLayout protectionComponent={null}>
        <Drawer.Screen name="index" options={{ title: 'Office' }} />
        <Drawer.Screen name="applications/index" options={{ title: 'Applications' }} />
        <Drawer.Screen name="cms/index" options={{ title: 'Users' }} />
        <Drawer.Screen name="users/[id]/edit" options={{ title: 'Edit User' }} />
        <Drawer.Screen name="jobs/index" options={{ title: 'Jobs' }} />
        <Drawer.Screen name="jobs/create" options={{ title: 'Create Job' }} />
        <Drawer.Screen name="jobs/[id]/edit" options={{ title: 'Edit Job' }} />
        <Drawer.Screen name="teams/index" options={{ title: 'Teams' }} />
        <Drawer.Screen name="teams/create" options={{ title: 'Create Team' }} />
        <Drawer.Screen name="teams/[id]/index" options={{ title: 'Team Detail' }} />
        <Drawer.Screen name="teams/[id]/edit" options={{ title: 'Edit Team' }} />
        <Drawer.Screen name="teams/[id]/analytics" options={{ title: 'Team Analytics' }} />
        <Drawer.Screen name="teams/[id]/settings" options={{ title: 'Team Settings' }} />
        <Drawer.Screen name="universities/index" options={{ title: 'Universities' }} />
        <Drawer.Screen name="universities/create" options={{ title: 'Create University' }} />
        <Drawer.Screen name="universities/[id]/edit" options={{ title: 'Edit University' }} />
        <Drawer.Screen name="organizations/index" options={{ title: 'Organizations' }} />
        <Drawer.Screen name="organizations/create" options={{ title: 'Create Organization' }} />
        <Drawer.Screen name="organizations/[id]/edit" options={{ title: 'Edit Organization' }} />
        <Drawer.Screen name="background-checks/index" options={{ title: 'Background Checks' }} />
        <Drawer.Screen
          name="background-checks/request"
          options={{ title: 'Request Background Check' }}
        />
        <Drawer.Screen name="storage/index" options={{ title: 'Storage Analytics' }} />
        <Drawer.Screen name="settings/geographic" options={{ title: 'Geographic Settings' }} />
        <Drawer.Screen name="settings/stripe" options={{ title: 'Stripe Payments' }} />
      </DrawerLayout>
    </ErrorBoundary>
  )
}
