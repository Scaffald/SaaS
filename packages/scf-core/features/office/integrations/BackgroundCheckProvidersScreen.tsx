/**
 * Background Check Provider Management Screen
 *
 * Until #1024 this screen was a mock: hardcoded provider, package and
 * webhook-event arrays that showed Checkr as the connected default with live
 * webhook traffic, and Set-as-default / Copy buttons that did nothing. None
 * of it was real. Checks requested in Scaffald run through its own screening
 * integration (the background-checks api routes); there is no per-office
 * provider account to connect. Decision (Clay, 2026-10-07): remove the dummy
 * data. The screen now says that and points at the checks themselves.
 *
 * @see Issue #97 - Background Check API Integration
 */

import { EmptyState, ScreenHeader, Stack } from '@scaffald/ui'
import { useRouter } from 'expo-router'
import { ShieldCheck } from 'lucide-react-native'
import { ROUTES } from '@scf/core/constants/routes'

export function BackgroundCheckProvidersScreen() {
  const router = useRouter()

  return (
    <Stack gap={16}>
      <ScreenHeader
        kicker="Integrations"
        title="Background-check providers"
        tip="Where the background checks you request are run."
      />
      <EmptyState
        icon={ShieldCheck}
        title="No provider of your own connected"
        description="Background checks you request in Scaffald run through Scaffald's screening service. Connecting your own provider account isn't available yet."
        action={{
          label: 'View background checks',
          onPress: () => router.push(ROUTES.OFFICE.ATS.CHECKS.path as never),
        }}
      />
    </Stack>
  )
}
