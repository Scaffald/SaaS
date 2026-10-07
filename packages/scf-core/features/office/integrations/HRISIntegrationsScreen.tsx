/**
 * HRIS/Payroll Integrations Screen
 *
 * Until #1024 this screen was a mock: hardcoded provider, sync-log and
 * field-mapping arrays that told an admin "ADP Workforce Now — Connected,
 * 47 records synced", with Sync, Configure and schedule buttons that did
 * nothing. Nothing in the app reads or writes `core.hris_connections`, so
 * none of that had happened. Decision (Clay, 2026-10-07): remove the dummy
 * data. The screen now says what is true, and gains its provider list and
 * sync history again when an integration actually exists.
 *
 * @see Issue #96 - Payroll/HRIS Integration
 */

import { EmptyState, ScreenHeader, Stack } from '@scaffald/ui'
import { Building2 } from 'lucide-react-native'

export function HRISIntegrationsScreen() {
  return (
    <Stack gap={16}>
      <ScreenHeader
        kicker="Integrations"
        title="HRIS & payroll"
        tip="Sync hired candidates into your HRIS or payroll system."
      />
      <EmptyState
        icon={Building2}
        title="No HRIS or payroll system connected"
        description="Scaffald can't connect to an HRIS or payroll provider yet. When it can, your connection, its sync history and field mappings will appear here."
      />
    </Stack>
  )
}
