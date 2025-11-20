import { OfficeNotificationsConsole } from '@app/core/features/office/office-notifications-console'
import { OfficeStorageDashboard } from '@app/core/features/office/office-storage-dashboard'
import { OfficeLayout } from '@app/ui'
import { Separator, YStack } from 'tamagui'

export default function OfficeIndex() {
  return (
    <OfficeLayout
      leftContent={
        <YStack gap="$8" flex={1}>
          <OfficeNotificationsConsole />
          <Separator bg="$color4" />
          <OfficeStorageDashboard />
        </YStack>
      }
    />
  )
}
