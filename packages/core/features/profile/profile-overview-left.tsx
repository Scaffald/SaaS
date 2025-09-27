import { ScrollView, YStack } from '@app/ui'

import { ProfileOverview as ProfileOverviewContent } from './components/ProfileOverview'

export function ProfileOverviewLeft() {
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <YStack gap="$5" pb="$8">
        <ProfileOverviewContent />
      </YStack>
    </ScrollView>
  )
}
