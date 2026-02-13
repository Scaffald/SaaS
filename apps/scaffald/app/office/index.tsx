import { OfficeNotificationsConsole } from '@scf/core/features/office/office-notifications-console'
import { OfficeStorageDashboard } from '@scf/core/features/office/office-storage-dashboard'
import { OfficeLayout } from '@scf/core/components/layouts'
import { Separator, Stack } from '@unicornlove/beyond-ui'

export default function OfficeIndex() {
  return (
    <OfficeLayout
      leftContent={
        <Stack gap={32} flex={1}>
          <OfficeNotificationsConsole />
          <Separator backgroundColor="$color4" />
          <OfficeStorageDashboard />
        </Stack>
      }
    />
  )
}
