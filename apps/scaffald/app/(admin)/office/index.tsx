import { OfficeDeveloperLinks } from '@scf/core/features/office/OfficeDeveloperLinks'
import { OfficeNotificationsConsole } from '@scf/core/features/office/office-notifications-console'
import { OfficeOverview } from '@scf/core/features/office/office-overview'
import { OfficeStorageDashboard } from '@scf/core/features/office/office-storage-dashboard'
import { OfficeLayout } from '@scf/core/components/layouts'
import { Separator, Stack } from '@scaffald/ui'

/**
 * The Office opened straight into the notification delivery queue — an
 * operations table, with no indication of how much was waiting for an
 * administrator. The overview answers that first (#839); the consoles stay
 * below it.
 */
export default function OfficeIndex() {
  return (
    <OfficeLayout
      leftContent={
        <Stack gap={32}>
          <OfficeOverview />
          <Separator />
          <OfficeNotificationsConsole />
          <Separator />
          <OfficeStorageDashboard />
          <Separator />
          <OfficeDeveloperLinks />
        </Stack>
      }
    />
  )
}
