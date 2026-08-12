import { ErrorBoundary } from '@scf/core/components/ErrorBoundary'
import { DrawerLayout } from '@scf/core/features/drawer/DrawerLayout'
import { useOfficeRouteProtection } from '@scf/core/utils/auth/useOfficeRouteProtection'
import { useRoleProtectedRoute } from '@scf/core/utils/auth/useRoleProtectedRoute'
import { Stack } from 'expo-router'
import { View } from 'react-native'
import { Spinner, Text, Stack as UIStack } from '@scaffald/ui'

export default function OfficeLayout() {
  const { isAuthorized, isLoading } = useRoleProtectedRoute(['office'])
  const { isTabletOrAbove } = useOfficeRouteProtection()

  /**
   * The navigator renders unconditionally, with the loading state layered over
   * it. It must not be returned around.
   *
   * This layout used to `return <Spinner/>` while the role check resolved, and
   * `return null` when unauthorized or on a narrow viewport. Each of those
   * unmounts the navigator, and expo-router responds by rewriting the URL to
   * the nearest mounted segment — so deep-linking to any office child silently
   * became `/office`. Measured: navigating to `/office/applications` produced
   * the sequence ["/office/applications", "/office"] with the page still
   * reading "Loading...".
   *
   * That defeats every shareable office URL, including the per-application
   * detail route added in #537, whose entire purpose is being linkable. Same
   * failure class as the OAuth callback-hash loss fixed in #519, which is why
   * (admin)/_layout.tsx already renders `<Slot />` plus an overlay rather than
   * returning early.
   *
   * The hooks still perform their own redirects; this only stops the URL being
   * destroyed while they decide.
   */
  const showOverlay = isLoading || !isAuthorized || !isTabletOrAbove

  return (
    <ErrorBoundary
      context={{
        requiredRoles: ['office'],
        section: 'office',
      }}
    >
      <View style={{ flex: 1 }}>
      {/* Screen names must match the route files under this directory. The
          previous list named jobs/, teams/, organizations/, universities/ and
          background-checks/ at the top level; those all moved under cms/ and
          ats/, so every entry was a silent no-op and the routes that do exist
          had none. */}
        <DrawerLayout protectionComponent={null}>
          <Stack.Screen name="index" options={{ title: 'Office' }} />

          <Stack.Screen name="applications/index" options={{ title: 'Applications' }} />
          <Stack.Screen
            name="applications/[applicationId]/index"
            options={{ title: 'Candidate' }}
          />
          <Stack.Screen name="applications/[applicationId]/inquiry" options={{ title: 'Inquiry' }} />

          <Stack.Screen name="ats/index" options={{ title: 'ATS' }} />
          <Stack.Screen name="ats/metrics" options={{ title: 'Hiring Metrics' }} />
          <Stack.Screen name="ats/checks" options={{ title: 'Background Checks' }} />
          <Stack.Screen name="ats/request" options={{ title: 'Request Background Check' }} />
          <Stack.Screen name="ats/admin" options={{ title: 'Background Check Admin' }} />
          <Stack.Screen name="ats/id-verifications" options={{ title: 'ID Verifications' }} />
          <Stack.Screen name="ats/scheduling" options={{ title: 'Interview Scheduling' }} />
          <Stack.Screen name="ats/self-schedule" options={{ title: 'Self-Schedule' }} />

          <Stack.Screen name="cms/index" options={{ title: 'CMS' }} />
          <Stack.Screen name="cms/workers/index" options={{ title: 'Workers' }} />
          <Stack.Screen name="cms/workers/[id]/edit" options={{ title: 'Edit Worker' }} />
          <Stack.Screen name="cms/jobs/index" options={{ title: 'Jobs' }} />
          <Stack.Screen name="cms/jobs/create" options={{ title: 'Create Job' }} />
          <Stack.Screen name="cms/jobs/[id]/edit" options={{ title: 'Edit Job' }} />
          <Stack.Screen name="cms/teams/index" options={{ title: 'Teams' }} />
          <Stack.Screen name="cms/teams/create" options={{ title: 'Create Team' }} />
          <Stack.Screen name="cms/teams/[id]/index" options={{ title: 'Team Detail' }} />
          <Stack.Screen name="cms/teams/[id]/edit" options={{ title: 'Edit Team' }} />
          <Stack.Screen name="cms/teams/[id]/analytics" options={{ title: 'Team Analytics' }} />
          <Stack.Screen name="cms/teams/[id]/settings" options={{ title: 'Team Settings' }} />
          <Stack.Screen name="cms/organizations/index" options={{ title: 'Organizations' }} />
          <Stack.Screen name="cms/organizations/create" options={{ title: 'Create Organization' }} />
          <Stack.Screen name="cms/organizations/[id]/edit" options={{ title: 'Edit Organization' }} />
          <Stack.Screen name="cms/projects/index" options={{ title: 'Projects' }} />
          <Stack.Screen name="cms/projects/create" options={{ title: 'Create Project' }} />
          <Stack.Screen name="cms/projects/[id]/index" options={{ title: 'Project Detail' }} />
          <Stack.Screen name="cms/projects/[id]/edit" options={{ title: 'Edit Project' }} />
          <Stack.Screen name="cms/universities/index" options={{ title: 'Universities' }} />
          <Stack.Screen name="cms/universities/create" options={{ title: 'Create University' }} />
          <Stack.Screen name="cms/universities/[id]/edit" options={{ title: 'Edit University' }} />

          <Stack.Screen name="compliance/eeo-reports" options={{ title: 'EEO Reports' }} />
          <Stack.Screen name="compliance/project-hiring" options={{ title: 'Project Hiring' }} />
          <Stack.Screen name="integrations/hris" options={{ title: 'HRIS & Payroll' }} />
            <Stack.Screen
          name="integrations/background-checks"
          options={{ title: 'Background Check Providers' }}
        />

          <Stack.Screen name="storage/index" options={{ title: 'Storage Analytics' }} />
          <Stack.Screen name="payments/index" options={{ title: 'Payment Analytics' }} />
          <Stack.Screen name="transactions/index" options={{ title: 'Transaction History' }} />
          <Stack.Screen name="violations/index" options={{ title: 'Violation Reports' }} />
          <Stack.Screen name="settings/geographic" options={{ title: 'Geographic Settings' }} />
          <Stack.Screen name="settings/stripe" options={{ title: 'Stripe Payments' }} />
          <Stack.Screen name="api-keys/index" options={{ title: 'API Keys' }} />
          <Stack.Screen name="oauth-apps/index" options={{ title: 'OAuth Apps' }} />
          <Stack.Screen name="oauth-apps/[id]/index" options={{ title: 'OAuth App' }} />
          <Stack.Screen name="webhooks/index" options={{ title: 'Webhooks' }} />
          <Stack.Screen name="webhooks/create" options={{ title: 'Create Webhook' }} />
            <Stack.Screen
          name="communities/verification"
          options={{ title: 'Community Verification' }}
        />
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
