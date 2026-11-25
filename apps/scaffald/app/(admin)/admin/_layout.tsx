import { ErrorBoundary } from '@scf/core/components/ErrorBoundary'
import { scrollingScreenLayout } from '@scf/core/components/layouts/ScreenScroll'
import { DrawerLayout } from '@scf/core/features/drawer/DrawerLayout'
import { useOfficeRouteProtection } from '@scf/core/utils/auth/useOfficeRouteProtection'
import { useRoleProtectedRoute } from '@scf/core/utils/auth/useRoleProtectedRoute'
import { Stack } from 'expo-router'
import { View } from 'react-native'
import { Spinner, Text, Stack as UIStack } from '@scaffald/ui'

/**
 * Admin: platform setup staff rarely touch, split out of Office (#1439).
 *
 * The gate is Office's, unchanged: the `office` role, tablet width or wider.
 * Narrowing it to the `platform` role is a separate decision (epic #1442).
 *
 * The navigator renders unconditionally, with the loading state layered over
 * it; this layout must never return early. Unmounting the navigator while the
 * role check resolves makes expo-router rewrite the URL to the nearest mounted
 * segment, so a deep link to /admin/oauth-apps/<id> would silently become
 * /admin. See the comment in office/_layout.tsx and PR #519.
 */
export default function AdminSectionLayout() {
  const { isAuthorized, isLoading } = useRoleProtectedRoute(['office'])
  const { isTabletOrAbove } = useOfficeRouteProtection()

  const showOverlay = isLoading || !isAuthorized || !isTabletOrAbove

  return (
    <ErrorBoundary
      context={{
        requiredRoles: ['office'],
        section: 'admin',
      }}
    >
      <View style={{ flex: 1 }}>
        {/* Screen names must match the route files under this directory. */}
        <DrawerLayout protectionComponent={null} screenLayout={scrollingScreenLayout}>
          {/* Landings: each redirects to its tab's first page. */}
          <Stack.Screen name="index" options={{ title: 'Admin' }} />
          <Stack.Screen name="general/index" options={{ title: 'General' }} />
          <Stack.Screen name="billing/index" options={{ title: 'Billing' }} />
          <Stack.Screen name="integrations/index" options={{ title: 'Integrations' }} />
          <Stack.Screen name="system/index" options={{ title: 'System' }} />

          <Stack.Screen name="general/geographic" options={{ title: 'Geographic Settings' }} />

          <Stack.Screen name="billing/payments" options={{ title: 'Payments' }} />
          <Stack.Screen name="billing/transactions" options={{ title: 'Transactions' }} />
          <Stack.Screen name="billing/stripe" options={{ title: 'Stripe Settings' }} />

          <Stack.Screen
            name="integrations/background-checks"
            options={{ title: 'Background Check Providers' }}
          />
          <Stack.Screen name="integrations/hris" options={{ title: 'HRIS & Payroll' }} />

          <Stack.Screen name="oauth-apps/index" options={{ title: 'OAuth Apps' }} />
          <Stack.Screen name="oauth-apps/[id]/index" options={{ title: 'OAuth App' }} />

          <Stack.Screen name="system/notifications" options={{ title: 'Notifications' }} />
          <Stack.Screen name="system/storage" options={{ title: 'Storage' }} />
        </DrawerLayout>
        {showOverlay && (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0,0,0,0.03)',
            }}
            pointerEvents="auto"
          >
            <UIStack justify="center" align="center" gap={8}>
              <Spinner size="lg" />
              <Text>Loading…</Text>
            </UIStack>
          </View>
        )}
      </View>
    </ErrorBoundary>
  )
}
