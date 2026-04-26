import { ErrorBoundary } from '@scf/core/components/ErrorBoundary'
import { DrawerLayout } from '@scf/core/features/drawer/DrawerLayout'
import { useOfficeRouteProtection } from '@scf/core/utils/auth/useOfficeRouteProtection'
import { useRoleProtectedRoute } from '@scf/core/utils/auth/useRoleProtectedRoute'
import { Stack } from 'expo-router'
import { Spinner, Text, Stack as UIStack } from '@scaffald/ui'

export default function OfficeLayout() {
  const { isAuthorized, isLoading } = useRoleProtectedRoute(['office'])
  const { isTabletOrAbove } = useOfficeRouteProtection()

  // Show loading state BEFORE rendering the drawer
  if (isLoading) {
    return (
      <UIStack justify="center" align="center">
        <Spinner size="lg" />
        <Text>Loading...</Text>
      </UIStack>
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
        requiredRoles: ['office'],
        section: 'office',
      }}
    >
      <DrawerLayout protectionComponent={null}>
        <Stack.Screen name="index" options={{ title: 'Office' }} />
        <Stack.Screen name="applications/index" options={{ title: 'Applications' }} />
        <Stack.Screen name="cms/index" options={{ title: 'Users' }} />
        <Stack.Screen name="users/[id]/edit" options={{ title: 'Edit User' }} />
        <Stack.Screen name="jobs/index" options={{ title: 'Jobs' }} />
        <Stack.Screen name="jobs/create" options={{ title: 'Create Job' }} />
        <Stack.Screen name="jobs/[id]/edit" options={{ title: 'Edit Job' }} />
        <Stack.Screen name="teams/index" options={{ title: 'Teams' }} />
        <Stack.Screen name="teams/create" options={{ title: 'Create Team' }} />
        <Stack.Screen name="teams/[id]/index" options={{ title: 'Team Detail' }} />
        <Stack.Screen name="teams/[id]/edit" options={{ title: 'Edit Team' }} />
        <Stack.Screen name="teams/[id]/analytics" options={{ title: 'Team Analytics' }} />
        <Stack.Screen name="teams/[id]/settings" options={{ title: 'Team Settings' }} />
        <Stack.Screen name="universities/index" options={{ title: 'Universities' }} />
        <Stack.Screen name="universities/create" options={{ title: 'Create University' }} />
        <Stack.Screen name="universities/[id]/edit" options={{ title: 'Edit University' }} />
        <Stack.Screen name="organizations/index" options={{ title: 'Organizations' }} />
        <Stack.Screen name="organizations/create" options={{ title: 'Create Organization' }} />
        <Stack.Screen name="organizations/[id]/edit" options={{ title: 'Edit Organization' }} />
        <Stack.Screen name="background-checks/index" options={{ title: 'Background Checks' }} />
        <Stack.Screen
          name="background-checks/request"
          options={{ title: 'Request Background Check' }}
        />
        <Stack.Screen name="storage/index" options={{ title: 'Storage Analytics' }} />
        <Stack.Screen name="payments/index" options={{ title: 'Payment Analytics' }} />
        <Stack.Screen name="transactions/index" options={{ title: 'Transaction History' }} />
        <Stack.Screen name="violations/index" options={{ title: 'Violation Reports' }} />
        <Stack.Screen name="settings/geographic" options={{ title: 'Geographic Settings' }} />
        <Stack.Screen name="settings/stripe" options={{ title: 'Stripe Payments' }} />
        <Stack.Screen name="api-keys/page" options={{ title: 'API Keys' }} />
        <Stack.Screen
          name="communities/verification"
          options={{ title: 'Community Verification' }}
        />
      </DrawerLayout>
    </ErrorBoundary>
  )
}
