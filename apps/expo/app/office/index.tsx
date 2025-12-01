import { OfficeNotificationsConsole } from '@app/core/features/office/office-notifications-console'
import { OfficeStorageDashboard } from '@app/core/features/office/office-storage-dashboard'
import { OfficeLayout } from '@app/core/components/layouts'
import { Separator, YStack } from '@unicornlove/ui'

export default function OfficeIndex() {
  return (
    <OfficeLayout
      leftContent={
        <YStack gap="$8" flex={1}>
          <OfficeNotificationsConsole />
          <Separator backgroundColor="$color4" />
          <OfficeStorageDashboard />
        </YStack>
      }
    />
  )
}
