import { ScrollView, YStack } from '@app/ui'

import { ContactAvailabilityForm as ProfileContactAvailabilityContent } from './components/ContactAvailabilityForm'

export function ProfileContactAvailabilityLeft() {
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <YStack gap="$5" pb="$8">
        <ProfileContactAvailabilityContent />
      </YStack>
    </ScrollView>
  )
}
