import { ScrollView, Separator, YStack } from 'tamagui'

import { OfficeNotificationsConsole } from '@app/core/features/office/office-notifications-console'
import { OfficeStorageDashboard } from '@app/core/features/office/office-storage-dashboard'

export default function OfficeIndex() {
  return (
    <ScrollView px="$6" py="$6" contentContainerStyle={{ flex: 1 }}>
      <YStack gap="$8" flex={1}>
        <OfficeNotificationsConsole />
        <Separator bg="$color4" />
        <OfficeStorageDashboard />
      </YStack>
    </ScrollView>
  )
}
