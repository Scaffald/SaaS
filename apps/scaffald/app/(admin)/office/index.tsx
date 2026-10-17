import { OfficeDeveloperLinks } from '@scf/core/features/office/OfficeDeveloperLinks'
import { OfficeOverview } from '@scf/core/features/office/office-overview'
import { OfficeLayout } from '@scf/core/components/layouts'
import { Stack } from '@scaffald/ui'

/**
 * The Office home is the overview and nothing else (#1201). It used to stack
 * the Notification operations console and the Storage dashboard under it,
 * several screens of consoles on a phone; notifications has its own route
 * (/office/notifications) and storage already had one (/office/storage). Both
 * are linked from the overview's Consoles list. Developer links stay as a
 * footer.
 */
export default function OfficeIndex() {
  return (
    <OfficeLayout
      leftContent={
        <Stack gap={32}>
          <OfficeOverview />
          <OfficeDeveloperLinks />
        </Stack>
      }
      leftContainerProps={{ minWidth: '100%' }}
    />
  )
}
